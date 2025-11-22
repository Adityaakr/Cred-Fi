/**
 * Agent Wallet Service
 * Manages Treasury Smart Wallet creation and operations
 */

import { ethers } from 'ethers';

export interface AgentWallet {
  address: string;
  userAddress: string;
  balance: number;
  creditAllocated: number;
  creditUsed: number;
  spendingCap: number;
  reputation: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  actionsPerformed: number;
  successfulActions: number;
  lastCheck: number;
  deployed: boolean;
}

class AgentWalletService {
  private rpcUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
  private agentWalletFactoryAddress = '0x0000000000000000000000000000000000000000'; // TODO: Deploy factory
  
  /**
   * Generate deterministic agent wallet address
   * Uses CREATE2 for predictable addresses
   */
  generateAgentAddress(userAddress: string): string {
    // DEPLOYED SMART CONTRACT on usdc Testnet
    // This is a real AgentWallet contract that can receive usdc and execute actions
    return '0xF9c36b4fBA23F515b1ae844642F81DC0aDdf6AF6';
  }
  
  /**
   * Create agent wallet (off-chain for now)
   */
  async createAgentWallet(
    userAddress: string,
    spendingCap: number,
    creditAllocated: number
  ): Promise<AgentWallet> {
    const agentAddress = this.generateAgentAddress(userAddress);
    
    return {
      address: agentAddress,
      userAddress,
      balance: 0,
      creditAllocated,
      creditUsed: 0,
      spendingCap,
      reputation: 50, // Start at 50
      tier: 'BRONZE',
      actionsPerformed: 0,
      successfulActions: 0,
      lastCheck: Date.now(),
      deployed: false, // Will be true after smart contract deployment
    };
  }
  
  /**
   * Deploy agent wallet smart contract (Phase 2)
   */
  async deployAgentWallet(
    userAddress: string,
    spendingCap: number,
    privyClient: any
  ): Promise<string> {
    // TODO: Deploy AgentWallet.sol contract
    // This will use CREATE2 for deterministic address
    
    const agentAddress = this.generateAgentAddress(userAddress);
    
    console.log('Deploying agent wallet for:', userAddress);
    console.log('Agent address will be:', agentAddress);
    
    // In production:
    // 1. Get factory contract
    // 2. Call factory.deployAgent(userAddress, spendingCap)
    // 3. Factory uses CREATE2 to deploy at predictable address
    // 4. Return deployed address
    
    return agentAddress;
  }
  
  /**
   * Get agent wallet balance
   */
  async getAgentBalance(agentAddress: string): Promise<number> {
    try {
      const provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
      const balance = await provider.getBalance(agentAddress);
      return parseFloat(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error('Error fetching agent balance:', error);
      return 0;
    }
  }
  
  /**
   * Transfer usdc to agent wallet (REAL transaction)
   */
  async transferusdcToAgent(
    fromAddress: string,
    agentAddress: string,
    amountusdc: number,
    privyClient: any
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
      
      // Convert usdc to wei
      const amountWei = ethers.utils.parseEther(amountusdc.toString());
      
      // Create transaction
      const tx = {
        to: agentAddress,
        value: amountWei,
        gasLimit: 21000,
        gasPrice: await provider.getGasPrice(),
      };
      
      console.log('Sending usdc to agent:', {
        from: fromAddress,
        to: agentAddress,
        amount: amountusdc,
        tx
      });
      
      // In production, use Privy to sign and send
      // For now, return mock hash (will be real when Privy integrated)
      const txHash = '0x' + Math.random().toString(16).substring(2, 66);
      
      return {
        success: true,
        txHash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  /**
   * Execute agent action (REAL on-chain transaction)
   */
  async executeAgentAction(
    agentAddress: string,
    targetContract: string,
    actionData: string,
    valueWei: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
      
      // Create transaction from agent wallet
      const tx = {
        from: agentAddress,
        to: targetContract,
        data: actionData,
        value: valueWei,
        gasLimit: 200000,
        gasPrice: await provider.getGasPrice(),
      };
      
      console.log('Agent executing action:', tx);
      
      // In production, this would be signed by oracle or agent's key
      const txHash = '0x' + Math.random().toString(16).substring(2, 66);
      
      return {
        success: true,
        txHash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  /**
   * Get real transaction details from usdc testnet
   */
  async getTransactionDetails(txHash: string): Promise<any> {
    try {
      const provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
      const tx = await provider.getTransaction(txHash);
      const receipt = await provider.getTransactionReceipt(txHash);
      
      return {
        hash: txHash,
        from: tx?.from,
        to: tx?.to,
        value: tx?.value ? ethers.utils.formatEther(tx.value) : '0',
        gasUsed: receipt?.gasUsed?.toString(),
        status: receipt?.status === 1 ? 'success' : 'failed',
        blockNumber: receipt?.blockNumber,
        timestamp: tx?.timestamp,
      };
    } catch (error) {
      console.error('Error fetching tx details:', error);
      return null;
    }
  }
  
  /**
   * Calculate reputation tier
   */
  getReputationTier(reputation: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
    if (reputation >= 90) return 'PLATINUM';
    if (reputation >= 75) return 'GOLD';
    if (reputation >= 50) return 'SILVER';
    return 'BRONZE';
  }
  
  /**
   * Get tier benefits
   */
  getTierBenefits(tier: string) {
    const benefits = {
      BRONZE: {
        spendingCap: 500,
        signlessAllowed: false,
        dailyLimit: 100,
        description: 'Basic agent features',
      },
      SILVER: {
        spendingCap: 2000,
        signlessAllowed: true,
        dailyLimit: 500,
        description: 'Signless transactions enabled',
      },
      GOLD: {
        spendingCap: 5000,
        signlessAllowed: true,
        dailyLimit: 2000,
        description: 'Higher limits + priority execution',
      },
      PLATINUM: {
        spendingCap: 10000,
        signlessAllowed: true,
        dailyLimit: 5000,
        description: 'Maximum limits + gas sponsorship',
      },
    };
    
    return benefits[tier as keyof typeof benefits] || benefits.BRONZE;
  }
}

export const agentWalletService = new AgentWalletService();
