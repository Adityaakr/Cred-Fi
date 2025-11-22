/**
 * AI Agent Brain - Autonomous DeFi Decision Making
 * Uses AEON x402 for gasless execution
 */

import { x402Service } from './x402Service';

export interface DeFiOpportunity {
  type: 'swap' | 'stake' | 'yield';
  protocol: string;
  apy?: number;
  expectedReturn?: number;
  risk: 'low' | 'medium' | 'high';
  action: string;
  amount: string;
  token: string;
}

export interface AgentDecision {
  shouldExecute: boolean;
  opportunity?: DeFiOpportunity;
  reason: string;
  confidence: number; // 0-100
}

export class AIAgentBrain {
  private walletAddress: string;
  private riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  private minAPY: number;

  constructor(
    walletAddress: string,
    config?: {
      riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
      minAPY?: number;
    }
  ) {
    this.walletAddress = walletAddress;
    this.riskTolerance = config?.riskTolerance || 'moderate';
    this.minAPY = config?.minAPY || 5; // 5% minimum APY
  }

  /**
   * Analyze DeFi opportunities and make autonomous decisions
   */
  async analyzeOpportunities(): Promise<AgentDecision> {
    console.log('🤖 AI Agent: Analyzing DeFi opportunities...');

    // Fetch real DeFi data (simplified for demo)
    const opportunities = await this.fetchDeFiOpportunities();

    // Filter based on risk tolerance
    const suitableOpportunities = opportunities.filter(opp => {
      if (this.riskTolerance === 'conservative') {
        return opp.risk === 'low' && (opp.apy || 0) >= this.minAPY;
      } else if (this.riskTolerance === 'moderate') {
        return opp.risk !== 'high' && (opp.apy || 0) >= this.minAPY;
      } else {
        return (opp.apy || 0) >= this.minAPY;
      }
    });

    if (suitableOpportunities.length === 0) {
      return {
        shouldExecute: false,
        reason: 'No suitable opportunities found matching risk profile',
        confidence: 0,
      };
    }

    // Select best opportunity
    const bestOpportunity = suitableOpportunities.sort((a, b) => 
      (b.apy || 0) - (a.apy || 0)
    )[0];

    // Calculate confidence based on APY and risk
    const confidence = this.calculateConfidence(bestOpportunity);

    return {
      shouldExecute: confidence > 70,
      opportunity: bestOpportunity,
      reason: `Found ${bestOpportunity.protocol} with ${bestOpportunity.apy}% APY`,
      confidence,
    };
  }

  /**
   * Execute DeFi action via x402 (gasless)
   */
  async executeAction(opportunity: DeFiOpportunity): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    console.log('🚀 AI Agent: Executing DeFi action via x402...', opportunity);

    try {
      if (opportunity.type === 'swap') {
        return await x402Service.executeGaslessSwap(
          this.walletAddress,
          opportunity.token,
          'USDT', // Swap to USDT
          opportunity.amount,
          'pancakeswap'
        );
      } else if (opportunity.type === 'stake' || opportunity.type === 'yield') {
        return await x402Service.executeYieldOptimization(
          this.walletAddress,
          'stake',
          'venus',
          opportunity.amount
        );
      }

      return { success: false, error: 'Unknown opportunity type' };
    } catch (error: any) {
      console.error('❌ AI Agent: Execution failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch DeFi opportunities (mock data for demo, replace with real APIs)
   */
  private async fetchDeFiOpportunities(): Promise<DeFiOpportunity[]> {
    // In production, fetch from:
    // - DeFiLlama API for APY data
    // - PancakeSwap API for swap prices
    // - Venus Protocol API for lending rates
    
    // Mock opportunities for demo
    return [
      {
        type: 'yield',
        protocol: 'Venus Protocol',
        apy: 12.5,
        expectedReturn: 125,
        risk: 'low',
        action: 'Stake USDT',
        amount: '100',
        token: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
      },
      {
        type: 'yield',
        protocol: 'PancakeSwap Farms',
        apy: 18.3,
        expectedReturn: 183,
        risk: 'medium',
        action: 'Stake usdc-USDT LP',
        amount: '100',
        token: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
      },
      {
        type: 'swap',
        protocol: 'PancakeSwap',
        expectedReturn: 5,
        risk: 'low',
        action: 'Swap usdc to USDT',
        amount: '0.1',
        token: 'usdc',
      },
      {
        type: 'yield',
        protocol: 'Thena',
        apy: 22.7,
        expectedReturn: 227,
        risk: 'high',
        action: 'Stake in Thena Pool',
        amount: '100',
        token: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
      },
    ];
  }

  /**
   * Calculate confidence score for an opportunity
   */
  private calculateConfidence(opportunity: DeFiOpportunity): number {
    let confidence = 50; // Base confidence

    // APY factor
    if (opportunity.apy) {
      if (opportunity.apy > 20) confidence += 30;
      else if (opportunity.apy > 10) confidence += 20;
      else if (opportunity.apy > 5) confidence += 10;
    }

    // Risk factor
    if (opportunity.risk === 'low') confidence += 20;
    else if (opportunity.risk === 'medium') confidence += 10;
    else confidence -= 10;

    // Protocol reputation (simplified)
    if (opportunity.protocol.includes('Venus') || opportunity.protocol.includes('PancakeSwap')) {
      confidence += 10;
    }

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Generate AI reasoning for a decision
   */
  generateReasoning(decision: AgentDecision): string {
    if (!decision.shouldExecute || !decision.opportunity) {
      return `❌ No action taken: ${decision.reason}`;
    }

    const opp = decision.opportunity;
    return `
✅ AI Agent Decision (${decision.confidence}% confidence)

**Action:** ${opp.action}
**Protocol:** ${opp.protocol}
**Type:** ${opp.type}
**APY:** ${opp.apy}%
**Risk:** ${opp.risk}
**Amount:** ${opp.amount}

**Reasoning:**
- APY of ${opp.apy}% exceeds minimum threshold (${this.minAPY}%)
- Risk level (${opp.risk}) matches ${this.riskTolerance} profile
- Protocol has good reputation and liquidity
- Execution will be gasless via AEON x402

**Next Steps:**
Agent will execute this action autonomously using x402 protocol.
No gas fees required from your wallet.
    `.trim();
  }

  /**
   * Auto-pilot mode: Continuously analyze and execute
   */
  async runAutoPilot(intervalMinutes: number = 60): Promise<void> {
    console.log(`🤖 AI Agent: Auto-pilot enabled (checking every ${intervalMinutes} minutes)`);

    const analyze = async () => {
      const decision = await this.analyzeOpportunities();
      
      console.log('📊 Analysis Result:', {
        shouldExecute: decision.shouldExecute,
        confidence: decision.confidence,
        reason: decision.reason,
      });

      if (decision.shouldExecute && decision.opportunity) {
        console.log('🚀 Executing opportunity:', decision.opportunity);
        const result = await this.executeAction(decision.opportunity);
        
        if (result.success) {
          console.log('✅ Execution successful:', result.txHash);
        } else {
          console.error('❌ Execution failed:', result.error);
        }
      }
    };

    // Run immediately
    await analyze();

    // Then run on interval
    setInterval(analyze, intervalMinutes * 60 * 1000);
  }
}

/**
 * Pre-configured AI agents for different strategies
 */
export const createConservativeAgent = (walletAddress: string) => {
  return new AIAgentBrain(walletAddress, {
    riskTolerance: 'conservative',
    minAPY: 8,
  });
};

export const createAggressiveAgent = (walletAddress: string) => {
  return new AIAgentBrain(walletAddress, {
    riskTolerance: 'aggressive',
    minAPY: 15,
  });
};

export const createYieldOptimizerAgent = (walletAddress: string) => {
  return new AIAgentBrain(walletAddress, {
    riskTolerance: 'moderate',
    minAPY: 10,
  });
};
