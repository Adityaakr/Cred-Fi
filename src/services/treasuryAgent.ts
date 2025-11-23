/**
 * Treasury Smart Wallet Agent
 * Monitors spending, enforces policies, and manages x402 micropayments
 */

import { x402Service } from './x402Service';
import { creditService } from './creditService';

export interface TreasuryPolicy {
  dailyLimit: number;
  categoryLimits: {
    [category: string]: number;
  };
  requireApproval: boolean;
  autoRepay: boolean;
  minCreditHeadroom: number; // Minimum credit available before alert
}

export interface SpendingActivity {
  id: string;
  timestamp: number;
  amount: number;
  category: string;
  description: string;
  approved: boolean;
  reason?: string;
}

export interface AgentWallet {
  address: string;
  balance: number;
  creditAllocated: number;
  creditUsed: number;
  spendingCap: number;
  reputation: number; // 0-100
  actionsPerformed: number;
}

export interface PolicyCheckResult {
  allowed: boolean;
  reason: string;
  warnings: string[];
  creditHeadroom: number;
  dailyRemaining: number;
  categoryRemaining: number;
}

class TreasuryAgentService {
  private activities: SpendingActivity[] = [];
  private lastCheckTimestamp: number = 0;
  private checkInterval: number = 60000; // 1 minute
  private agentWallets: Map<string, AgentWallet> = new Map();

  /**
   * Create a new agent wallet with spending cap
   */
  createAgentWallet(
    ownerAddress: string,
    spendingCap: number,
    creditAllocated: number = 0
  ): AgentWallet {
    const agentWallet: AgentWallet = {
      address: `0xagent${Date.now().toString(16)}`, // Mock agent address
      balance: 0,
      creditAllocated,
      creditUsed: 0,
      spendingCap,
      reputation: 50, // Start at 50
      actionsPerformed: 0,
    };

    this.agentWallets.set(ownerAddress, agentWallet);
    return agentWallet;
  }

  /**
   * Get agent wallet for user
   */
  getAgentWallet(ownerAddress: string): AgentWallet | null {
    return this.agentWallets.get(ownerAddress) || null;
  }

  /**
   * Check if spending is allowed based on policy
   */
  async checkPolicy(
    walletAddress: string,
    amount: number,
    category: string,
    policy: TreasuryPolicy
  ): Promise<PolicyCheckResult> {
    const warnings: string[] = [];
    let allowed = true;
    let reason = 'Transaction approved';

    // 1. Check credit headroom
    const creditData = await creditService.getCreditData(walletAddress);
    const creditHeadroom = creditData.limit - creditData.borrowed;

    if (creditHeadroom < policy.minCreditHeadroom) {
      warnings.push(
        `⚠️ Low credit headroom: $${creditHeadroom.toFixed(2)} remaining`
      );
    }

    if (amount > creditHeadroom) {
      allowed = false;
      reason = `Insufficient credit headroom. Available: $${creditHeadroom.toFixed(2)}`;
      return { allowed, reason, warnings, creditHeadroom, dailyRemaining: 0, categoryRemaining: 0 };
    }

    // 2. Check daily limit
    const today = new Date().toDateString();
    const todaySpending = this.activities
      .filter(a => new Date(a.timestamp).toDateString() === today)
      .reduce((sum, a) => sum + a.amount, 0);

    const dailyRemaining = policy.dailyLimit - todaySpending;

    if (amount > dailyRemaining) {
      allowed = false;
      reason = `Daily limit exceeded. Remaining: $${dailyRemaining.toFixed(2)}`;
      return { allowed, reason, warnings, creditHeadroom, dailyRemaining, categoryRemaining: 0 };
    }

    if (dailyRemaining < policy.dailyLimit * 0.2) {
      warnings.push(
        `⚠️ Daily limit almost reached: $${dailyRemaining.toFixed(2)} remaining`
      );
    }

    // 3. Check category limit
    const categoryLimit = policy.categoryLimits[category] || Infinity;
    const categorySpending = this.activities
      .filter(a => a.category === category && new Date(a.timestamp).toDateString() === today)
      .reduce((sum, a) => sum + a.amount, 0);

    const categoryRemaining = categoryLimit - categorySpending;

    if (amount > categoryRemaining) {
      allowed = false;
      reason = `Category limit exceeded for ${category}. Remaining: $${categoryRemaining.toFixed(2)}`;
      return { allowed, reason, warnings, creditHeadroom, dailyRemaining, categoryRemaining };
    }

    // 4. Check if approval required
    if (policy.requireApproval && amount > 100) {
      warnings.push('💰 Large transaction - approval recommended');
    }

    return {
      allowed,
      reason,
      warnings,
      creditHeadroom,
      dailyRemaining,
      categoryRemaining,
    };
  }

  /**
   * Record spending activity
   */
  recordActivity(
    amount: number,
    category: string,
    description: string,
    approved: boolean,
    reason?: string
  ): SpendingActivity {
    const activity: SpendingActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      amount,
      category,
      description,
      approved,
      reason,
    };

    this.activities.push(activity);
    return activity;
  }

  /**
   * Get recent activities
   */
  getRecentActivities(limit: number = 10): SpendingActivity[] {
    return this.activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Monitor and execute micropayment (called every 1 min)
   */
  async executeMicropayment(
    walletAddress: string,
    amount: number = 0.001
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Execute x402 micropayment for monitoring service
      const result = await x402Service.executeGaslessPayment(
        walletAddress,
        '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd', // USDT
        amount.toString(),
        '0x9C6CCbC95c804C3FB0024e5f10e2e978855280B3', // Treasury service recipient (wallet with funds)
        'Treasury monitoring fee'
      );

      if (result.success) {
        this.lastCheckTimestamp = Date.now();
        this.recordActivity(
          amount,
          'monitoring',
          'Treasury agent monitoring fee',
          true
        );
      }

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get time until next check
   */
  getTimeUntilNextCheck(): number {
    const elapsed = Date.now() - this.lastCheckTimestamp;
    const remaining = Math.max(0, this.checkInterval - elapsed);
    return Math.floor(remaining / 1000); // Return seconds
  }

  /**
   * Agent performs autonomous action with allocated credit
   */
  async agentExecuteAction(
    ownerAddress: string,
    action: string,
    amount: number,
    category: string
  ): Promise<{ success: boolean; reputation?: number; error?: string }> {
    const agentWallet = this.agentWallets.get(ownerAddress);
    
    if (!agentWallet) {
      return { success: false, error: 'Agent wallet not found' };
    }

    // Check spending cap
    const totalSpent = agentWallet.creditUsed + amount;
    if (totalSpent > agentWallet.spendingCap) {
      return { 
        success: false, 
        error: `Spending cap exceeded. Cap: $${agentWallet.spendingCap}, Used: $${agentWallet.creditUsed}` 
      };
    }

    // Check credit allocation
    if (totalSpent > agentWallet.creditAllocated) {
      return { 
        success: false, 
        error: `Credit allocation exceeded. Allocated: $${agentWallet.creditAllocated}` 
      };
    }

    // Execute action (mock for now)
    agentWallet.creditUsed += amount;
    agentWallet.actionsPerformed += 1;

    // Build reputation based on successful actions
    const reputationGain = Math.min(5, amount / 10); // Gain up to 5 points per action
    agentWallet.reputation = Math.min(100, agentWallet.reputation + reputationGain);

    this.recordActivity(
      amount,
      category,
      `Agent action: ${action}`,
      true,
      'Autonomous agent execution'
    );

    return {
      success: true,
      reputation: agentWallet.reputation,
    };
  }

  /**
   * Get agent statistics
   */
  getAgentStats(ownerAddress: string) {
    const agentWallet = this.agentWallets.get(ownerAddress);
    if (!agentWallet) return null;

    const agentActivities = this.activities.filter(a => 
      a.description.includes('Agent action')
    );

    return {
      wallet: agentWallet,
      totalActions: agentActivities.length,
      successRate: agentActivities.filter(a => a.approved).length / agentActivities.length * 100,
      totalSpent: agentWallet.creditUsed,
      remainingCredit: agentWallet.creditAllocated - agentWallet.creditUsed,
      remainingCap: agentWallet.spendingCap - agentWallet.creditUsed,
      reputation: agentWallet.reputation,
    };
  }

  /**
   * Get spending summary
   */
  getSpendingSummary() {
    const today = new Date().toDateString();
    const todayActivities = this.activities.filter(
      a => new Date(a.timestamp).toDateString() === today
    );

    const byCategory = todayActivities.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + a.amount;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalToday: todayActivities.reduce((sum, a) => sum + a.amount, 0),
      transactionsToday: todayActivities.length,
      approvedToday: todayActivities.filter(a => a.approved).length,
      deniedToday: todayActivities.filter(a => !a.approved).length,
      byCategory,
    };
  }
}

export const treasuryAgent = new TreasuryAgentService();
