/**
 * AI Agent Service using AEON x402 protocol
 * Manages AI agents with budgets, policies, and autonomous actions
 */

import { x402Service } from './x402Service';
import { AIAgentBrain, DeFiOpportunity, AgentDecision } from './aiAgentBrain';

export interface Agent {
  id: string;
  name: string;
  type: 'defi_payment' | 'yield_optimizer' | 'custom';
  description: string;
  avatar: string;
  status: 'active' | 'paused' | 'inactive';
  budget: {
    daily: number;
    monthly: number;
    used: number;
    available: number;
  };
  policy: {
    canSpend: boolean;
    maxPerTransaction: number;
    allowedCategories: string[];
    requiresApproval: boolean;
    useX402: boolean; // Enable gasless payments via AEON x402
  };
  stats: {
    totalSpent: number;
    transactionsProcessed: number;
    lastActive: number;
    createdAt: number;
    gaslessTxCount: number; // x402 gasless transactions
  };
  capabilities: string[];
}

export interface AgentAction {
  id: string;
  agentId: string;
  type: 'analysis' | 'payment' | 'alert' | 'report';
  description: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  data?: any;
}

export class AgentService {
  private storageKey = 'proteus_agents';
  private actionsKey = 'proteus_agent_actions';

  /**
   * Get all agents for a wallet
   */
  getAgents(walletAddress: string): Agent[] {
    const stored = localStorage.getItem(`${this.storageKey}_${walletAddress.toLowerCase()}`);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Save agents
   */
  private saveAgents(walletAddress: string, agents: Agent[]): void {
    localStorage.setItem(
      `${this.storageKey}_${walletAddress.toLowerCase()}`,
      JSON.stringify(agents)
    );
  }

  /**
   * Create a new agent
   */
  createAgent(
    walletAddress: string,
    name: string,
    type: Agent['type'],
    dailyBudget: number,
    monthlyBudget: number
  ): Agent {
    const agents = this.getAgents(walletAddress);

    const agentTemplates = {
      defi_payment: {
        description: 'Executes DeFi payments with AEON x402 gasless transactions',
        avatar: '💸',
        capabilities: [
          'Gasless swaps via x402',
          'DeFi protocol payments',
          'Multi-token support',
          'No gas fees for user',
          'PancakeSwap integration',
        ],
        policy: {
          canSpend: true,
          maxPerTransaction: 500,
          allowedCategories: ['defi', 'swap', 'payment'],
          requiresApproval: false,
          useX402: true,
        },
      },
      yield_optimizer: {
        description: 'Optimizes yield farming and DeFi positions with x402',
        avatar: '🌾',
        capabilities: [
          'Monitor APY rates',
          'Auto-compound rewards',
          'Rebalance positions',
          'Gasless staking via x402',
          'Venus Protocol integration',
        ],
        policy: {
          canSpend: true,
          maxPerTransaction: 500,
          allowedCategories: ['defi', 'yield', 'staking'],
          requiresApproval: true,
          useX402: true,
        },
      },
      custom: {
        description: 'Custom agent with configurable capabilities',
        avatar: '🤖',
        capabilities: ['Custom actions'],
        policy: {
          canSpend: false,
          maxPerTransaction: 50,
          allowedCategories: [],
          requiresApproval: true,
          useX402: false,
        },
      },
    };

    const template = agentTemplates[type];

    const newAgent: Agent = {
      id: `agent_${Date.now()}`,
      name,
      type,
      description: template.description,
      avatar: template.avatar,
      status: 'active',
      budget: {
        daily: dailyBudget,
        monthly: monthlyBudget,
        used: 0,
        available: dailyBudget,
      },
      policy: template.policy,
      stats: {
        totalSpent: 0,
        transactionsProcessed: 0,
        lastActive: Date.now(),
        createdAt: Date.now(),
        gaslessTxCount: 0,
      },
      capabilities: template.capabilities,
    };

    agents.push(newAgent);
    this.saveAgents(walletAddress, agents);

    return newAgent;
  }

  /**
   * Update agent status
   */
  updateAgentStatus(walletAddress: string, agentId: string, status: Agent['status']): void {
    const agents = this.getAgents(walletAddress);
    const agent = agents.find(a => a.id === agentId);
    
    if (agent) {
      agent.status = status;
      this.saveAgents(walletAddress, agents);
    }
  }

  /**
   * Record agent action
   */
  recordAction(
    walletAddress: string,
    agentId: string,
    type: AgentAction['type'],
    description: string,
    data?: any
  ): AgentAction {
    const actions = this.getActions(walletAddress);
    
    const action: AgentAction = {
      id: `action_${Date.now()}`,
      agentId,
      type,
      description,
      timestamp: Date.now(),
      status: 'completed',
      data,
    };

    actions.push(action);
    localStorage.setItem(
      `${this.actionsKey}_${walletAddress.toLowerCase()}`,
      JSON.stringify(actions)
    );

    // Update agent stats
    const agents = this.getAgents(walletAddress);
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      agent.stats.transactionsProcessed++;
      agent.stats.lastActive = Date.now();
      this.saveAgents(walletAddress, agents);
    }

    return action;
  }

  /**
   * Get agent actions
   */
  getActions(walletAddress: string): AgentAction[] {
    const stored = localStorage.getItem(`${this.actionsKey}_${walletAddress.toLowerCase()}`);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Get actions for specific agent
   */
  getAgentActions(walletAddress: string, agentId: string): AgentAction[] {
    return this.getActions(walletAddress).filter(a => a.agentId === agentId);
  }

  /**
   * Simulate expense tracking analysis
   */
  async analyzeExpenses(walletAddress: string, agentId: string, transactions: any[]): Promise<{
    categories: { [key: string]: number };
    insights: string[];
    alerts: string[];
  }> {
    // Simulate AI analysis
    const categories: { [key: string]: number } = {
      'Food & Dining': 0,
      'Transportation': 0,
      'Entertainment': 0,
      'Shopping': 0,
      'Bills & Utilities': 0,
      'DeFi & Crypto': 0,
      'Other': 0,
    };

    // Simple categorization based on transaction patterns
    transactions.forEach(tx => {
      const amount = Math.abs(parseFloat(tx.value || '0'));
      
      // Simple heuristic categorization (in production, use AI)
      if (amount < 10) {
        categories['Food & Dining'] += amount;
      } else if (amount < 50) {
        categories['Transportation'] += amount;
      } else if (amount < 100) {
        categories['Entertainment'] += amount;
      } else {
        categories['DeFi & Crypto'] += amount;
      }
    });

    const totalSpent = Object.values(categories).reduce((a, b) => a + b, 0);

    const insights = [
      `Analyzed ${transactions.length} transactions`,
      `Total spending: $${totalSpent.toFixed(2)}`,
      `Largest category: ${Object.entries(categories).sort((a, b) => b[1] - a[1])[0][0]}`,
      `Average transaction: $${(totalSpent / transactions.length).toFixed(2)}`,
    ];

    const alerts = [];
    if (totalSpent > 500) {
      alerts.push('⚠️ High spending detected this period');
    }
    if (categories['DeFi & Crypto'] > totalSpent * 0.5) {
      alerts.push('📈 Majority of spending in DeFi activities');
    }

    // Record the analysis action
    this.recordAction(walletAddress, agentId, 'analysis', 'Expense analysis completed', {
      categories,
      totalSpent,
      transactionCount: transactions.length,
    });

    return { categories, insights, alerts };
  }

  /**
   * Generate agent report
   */
  generateReport(walletAddress: string, agentId: string): string {
    const agent = this.getAgents(walletAddress).find(a => a.id === agentId);
    const actions = this.getAgentActions(walletAddress, agentId);

    if (!agent) return 'Agent not found';

    const report = `
📊 **${agent.name} Report**

**Status:** ${agent.status}
**Budget Used:** $${agent.budget.used.toFixed(2)} / $${agent.budget.monthly.toFixed(2)}
**Transactions Processed:** ${agent.stats.transactionsProcessed}
**Last Active:** ${new Date(agent.stats.lastActive).toLocaleString()}

**Recent Actions:**
${actions.slice(-5).map(a => `• ${a.description} (${new Date(a.timestamp).toLocaleString()})`).join('\n')}

**Capabilities:**
${agent.capabilities.map(c => `✓ ${c}`).join('\n')}
    `.trim();

    return report;
  }

  /**
   * Delete agent
   */
  deleteAgent(walletAddress: string, agentId: string): void {
    const agents = this.getAgents(walletAddress);
    const filtered = agents.filter(a => a.id !== agentId);
    this.saveAgents(walletAddress, filtered);
  }

  /**
   * Execute DeFi swap via agent using Q402 (gasless)
   */
  async executeAgentSwap(
    walletAddress: string,
    agentId: string,
    fromToken: string,
    toToken: string,
    amount: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const agent = this.getAgents(walletAddress).find(a => a.id === agentId);
    
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    if (agent.status !== 'active') {
      return { success: false, error: 'Agent is not active' };
    }

    if (!agent.policy.useX402) {
      return { success: false, error: 'Agent does not have x402 enabled' };
    }

    const amountNum = parseFloat(amount);
    if (amountNum > agent.policy.maxPerTransaction) {
      return { success: false, error: 'Amount exceeds max per transaction' };
    }

    try {
      const result = await x402Service.executeGaslessSwap(
        walletAddress,
        fromToken,
        toToken,
        amount,
        'pancakeswap'
      );

      if (result.success) {
        // Update agent stats
        const agents = this.getAgents(walletAddress);
        const agentIndex = agents.findIndex(a => a.id === agentId);
        if (agentIndex !== -1) {
          agents[agentIndex].stats.transactionsProcessed++;
          agents[agentIndex].stats.gaslessTxCount++;
          agents[agentIndex].stats.lastActive = Date.now();
          this.saveAgents(walletAddress, agents);
        }

        // Record action
        this.recordAction(
          walletAddress,
          agentId,
          'payment',
          `Gasless swap: ${amount} ${fromToken} → ${toToken}`,
          { txHash: result.txHash, gasSponsored: true }
        );
      }

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Run AI analysis for an agent
   */
  async runAIAnalysis(
    walletAddress: string,
    agentId: string
  ): Promise<{ decision: AgentDecision; reasoning: string }> {
    const agent = this.getAgents(walletAddress).find(a => a.id === agentId);
    
    if (!agent) {
      throw new Error('Agent not found');
    }

    if (agent.status !== 'active') {
      throw new Error('Agent is not active');
    }

    // Create AI brain based on agent type
    const riskTolerance = agent.type === 'yield_optimizer' ? 'moderate' : 'conservative';
    const aiBrain = new AIAgentBrain(walletAddress, {
      riskTolerance,
      minAPY: 8,
    });

    // Analyze opportunities
    const decision = await aiBrain.analyzeOpportunities();
    const reasoning = aiBrain.generateReasoning(decision);

    // Record the analysis
    this.recordAction(
      walletAddress,
      agentId,
      'analysis',
      `AI Analysis: ${decision.reason}`,
      { confidence: decision.confidence, shouldExecute: decision.shouldExecute }
    );

    return { decision, reasoning };
  }

  /**
   * Execute AI agent's decision autonomously
   */
  async executeAIDecision(
    walletAddress: string,
    agentId: string,
    decision: AgentDecision
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const agent = this.getAgents(walletAddress).find(a => a.id === agentId);
    
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    if (!decision.shouldExecute || !decision.opportunity) {
      return { success: false, error: 'Decision does not recommend execution' };
    }

    if (!agent.policy.useX402) {
      return { success: false, error: 'Agent does not have x402 enabled' };
    }

    // Create AI brain and execute
    const aiBrain = new AIAgentBrain(walletAddress);
    const result = await aiBrain.executeAction(decision.opportunity);

    if (result.success) {
      // Update agent stats
      const agents = this.getAgents(walletAddress);
      const agentIndex = agents.findIndex(a => a.id === agentId);
      if (agentIndex !== -1) {
        agents[agentIndex].stats.transactionsProcessed++;
        agents[agentIndex].stats.gaslessTxCount++;
        agents[agentIndex].stats.lastActive = Date.now();
        this.saveAgents(walletAddress, agents);
      }

      // Record action
      this.recordAction(
        walletAddress,
        agentId,
        'payment',
        `AI Executed: ${decision.opportunity.action}`,
        { txHash: result.txHash, gasSponsored: true, confidence: decision.confidence }
      );
    }

    return result;
  }

  /**
   * Execute yield optimization via agent using x402 (gasless)
   */
  async executeAgentYieldOptimization(
    walletAddress: string,
    agentId: string,
    action: 'stake' | 'unstake' | 'compound',
    protocol: 'venus' | 'pancakeswap',
    amount: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const agent = this.getAgents(walletAddress).find(a => a.id === agentId);
    
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    if (agent.status !== 'active') {
      return { success: false, error: 'Agent is not active' };
    }

    if (!agent.policy.useX402) {
      return { success: false, error: 'Agent does not have x402 enabled' };
    }

    try {
      const result = await x402Service.executeYieldOptimization(
        walletAddress,
        action,
        protocol,
        amount
      );

      if (result.success) {
        // Update agent stats
        const agents = this.getAgents(walletAddress);
        const agentIndex = agents.findIndex(a => a.id === agentId);
        if (agentIndex !== -1) {
          agents[agentIndex].stats.transactionsProcessed++;
          agents[agentIndex].stats.gaslessTxCount++;
          agents[agentIndex].stats.lastActive = Date.now();
          this.saveAgents(walletAddress, agents);
        }

        // Record action
        this.recordAction(
          walletAddress,
          agentId,
          'payment',
          `Gasless ${action}: ${amount} on ${protocol}`,
          { txHash: result.txHash, gasSponsored: true }
        );
      }

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const agentService = new AgentService();
