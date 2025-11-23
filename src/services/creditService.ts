import { ethers, formatEther, parseEther, Wallet, JsonRpcProvider } from 'ethers';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  blockNumber: string;
}

interface CreditScore {
  score: number; // 0-100
  limit: number; // in USDT
  riskBand: 'Low' | 'Medium' | 'High';
  apr: number;
}

export class CreditService {
  // Polygon Mainnet configuration (matches Privy setup)
  private rpcUrl = 'https://polygon-bor-rpc.publicnode.com';
  private apiUrl = 'https://api.polygonscan.com/api';
  private apiKey = 'YourApiKeyToken'; // PolygonScan API key (optional)
  private creditVaultAddress = '0x9C6CCbC95c804C3FB0024e5f10e2e978855280B3'; // Credit vault (wallet with funds)
  private chainId = 137; // Polygon Mainnet
  private provider: JsonRpcProvider;
  private wallet: Wallet | null = null;

  constructor() {
    this.provider = new JsonRpcProvider(this.rpcUrl);
    
    // Initialize wallet with private key if available
    // Use EXPO_PUBLIC_ prefix for client-side access
    const privateKey = process.env.EXPO_PUBLIC_VAULT_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (privateKey) {
      try {
        this.wallet = new Wallet(privateKey, this.provider);
        console.log('✅ Credit vault wallet initialized:', this.wallet.address);
      } catch (error) {
        console.error('❌ Failed to initialize vault wallet:', error);
      }
    } else {
      console.warn('⚠️ No private key found in environment variables');
    }
  }

  /**
   * Get credit data for wallet (for treasury agent)
   */
  async getCreditData(address: string): Promise<{ score: number; limit: number; borrowed: number }> {
    const creditScore = await this.calculateCreditScore(address);
    // Mock borrowed amount for now
    const borrowed = 0;
    return { score: creditScore.score, limit: creditScore.limit, borrowed };
  }

  /**
   * Fetch transaction history from BscScan API
   */
  async getTransactionHistory(address: string): Promise<Transaction[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${this.apiKey}`
      );
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        return data.result.slice(0, 50); // Last 50 transactions
      }
      return [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  /**
   * Calculate cashflow metrics from transaction history
   */
  calculateCashflow(transactions: Transaction[], walletAddress: string) {
    let totalInflow = 0;
    let totalOutflow = 0;
    let transactionCount = 0;
    const monthlyInflows: number[] = [];
    
    const now = Date.now() / 1000;
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    
    transactions.forEach(tx => {
      const timestamp = parseInt(tx.timeStamp);
      const value = parseFloat(formatEther(tx.value));
      
      // Only count last 30 days
      if (timestamp >= thirtyDaysAgo) {
        transactionCount++;
        
        if (tx.to.toLowerCase() === walletAddress.toLowerCase()) {
          // Inflow
          totalInflow += value;
          monthlyInflows.push(value);
        } else if (tx.from.toLowerCase() === walletAddress.toLowerCase()) {
          // Outflow
          totalOutflow += value;
        }
      }
    });
    
    const netCashflow = totalInflow - totalOutflow;
    const avgTransactionSize = transactionCount > 0 ? (totalInflow + totalOutflow) / transactionCount : 0;
    
    return {
      totalInflow,
      totalOutflow,
      netCashflow,
      transactionCount,
      avgTransactionSize,
      monthlyInflows,
    };
  }

  /**
   * Calculate credit score based on on-chain activity
   */
  async calculateCreditScore(address: string): Promise<CreditScore> {
    try {
      const transactions = await this.getTransactionHistory(address);
      const cashflow = this.calculateCashflow(transactions, address);
      
      // Credit score algorithm
      let score = 0;
      
      // 1. Transaction count (max 30 points)
      score += Math.min(cashflow.transactionCount * 2, 30);
      
      // 2. Net cashflow (max 30 points)
      if (cashflow.netCashflow > 0) {
        score += Math.min(cashflow.netCashflow * 10, 30);
      }
      
      // 3. Total inflow (max 25 points)
      score += Math.min(cashflow.totalInflow * 5, 25);
      
      // 4. Consistency (max 15 points)
      if (cashflow.monthlyInflows.length > 0) {
        const consistency = cashflow.monthlyInflows.length / 30; // Days with activity
        score += consistency * 15;
      }
      
      // Cap at 100
      score = Math.min(Math.round(score), 100);
      
      // Calculate credit limit using improved formula
      // Limit = clamp(α · median(inflow₆₀₋₉₀ₐ) − β · volatility, floor, cap)
      
      // Calculate median inflow (60-90 day window)
      const medianInflow = cashflow.monthlyInflows.length > 0
        ? cashflow.monthlyInflows.sort((a, b) => a - b)[Math.floor(cashflow.monthlyInflows.length / 2)]
        : 0;
      
      // Calculate volatility (standard deviation of inflows)
      const avgInflow = cashflow.monthlyInflows.reduce((a, b) => a + b, 0) / (cashflow.monthlyInflows.length || 1);
      const variance = cashflow.monthlyInflows.reduce((sum, val) => sum + Math.pow(val - avgInflow, 2), 0) / (cashflow.monthlyInflows.length || 1);
      const volatility = Math.sqrt(variance);
      
      // Formula constants
      const alpha = 0.6; // 60% of median inflow
      const beta = 0.3;  // Volatility penalty
      const usdc_TO_USD = 600;
      
      // Calculate limit
      const baseLimit = (alpha * medianInflow * usdc_TO_USD) - (beta * volatility * usdc_TO_USD);
      let limit = Math.round(baseLimit);
      
      // Clamp between floor and cap
      const floor = 100;
      const cap = 10000;
      limit = Math.max(floor, Math.min(limit, cap));
      
      // Determine risk band and APR
      let riskBand: 'Low' | 'Medium' | 'High';
      let apr: number;
      
      if (score >= 70) {
        riskBand = 'Low';
        apr = 8.5;
      } else if (score >= 40) {
        riskBand = 'Medium';
        apr = 12.5;
      } else {
        riskBand = 'High';
        apr = 18.5;
      }
      
      return {
        score,
        limit,
        riskBand,
        apr,
      };
    } catch (error) {
      console.error('Error calculating credit score:', error);
      // Return default values
      return {
        score: 50,
        limit: 500,
        riskBand: 'Medium',
        apr: 12.5,
      };
    }
  }

  /**
   * Get current balance in USDT (mock for now)
   */
  async getUSDTBalance(address: string): Promise<number> {
    // In production, fetch real USDT balance from contract
    // For demo, return mock balance
    return 1000;
  }

  /**
   * Borrow USDT - Privy signs with vault wallet (0x9C6C...80B3)
   */
  async borrow(
    walletAddress: string,
    amount: number,
    sendTransaction: any
  ): Promise<string> {
    try {
      console.log('🏦 Initiating borrow transaction');
      console.log('  - Borrower:', walletAddress);
      console.log('  - Amount:', amount, 'USDT');
      console.log('  - Vault Wallet:', this.creditVaultAddress);
      
      // Use Privy to send transaction with vault wallet
      // FORCE use the specific recipient address
      const recipientAddress = '0x6247d7b8b5f667662572b1c249ef1f1483cbfc14';
      
      console.log('📱 Privy signing with vault wallet...');
      console.log('  - From:', this.creditVaultAddress);
      console.log('  - To:', recipientAddress);
      console.log('  - Value:', (amount * 0.001), 'POL');
      
      const result = await sendTransaction({
        to: recipientAddress, // Send TO specific address
        value: parseEther((amount * 0.001).toString()), // Convert USDT to POL (keep as BigInt)
        chainId: this.chainId,
      }, {
        address: this.creditVaultAddress, // Specify vault wallet address
      });
      
      const txHash = result?.transactionHash || result?.hash || result;
      console.log('✅ Borrow transaction sent:', txHash);
      console.log('  - View on PolygonScan: https://polygonscan.com/tx/' + txHash);
      
      return txHash;
    } catch (error: any) {
      console.error('❌ Borrow transaction failed:', error);
      throw new Error(error.message || 'Failed to send borrow transaction');
    }
  }

  /**
   * Repay USDT - Privy signs with vault wallet (0x9C6C...80B3)
   */
  async repay(
    walletAddress: string,
    amount: number,
    sendTransaction: any
  ): Promise<string> {
    try {
      console.log('💰 Initiating repay transaction');
      console.log('  - Repayer:', walletAddress);
      console.log('  - Amount:', amount, 'USDT');
      console.log('  - Vault Wallet:', this.creditVaultAddress);
      
      // Use Privy to send transaction with vault wallet
      console.log('📱 Privy signing with vault wallet...');
      console.log('  - From:', this.creditVaultAddress);
      console.log('  - To: 0x6247d7b8b5f667662572b1c249ef1f1483cbfc14');
      console.log('  - Value:', (amount * 0.0001), 'POL');
      
      const result = await sendTransaction({
        to: '0x6247d7b8b5f667662572b1c249ef1f1483cbfc14', // Send to different address (not self)
        value: parseEther((amount * 0.0001).toString()), // Small amount to record (keep as BigInt)
        chainId: this.chainId,
      }, {
        address: this.creditVaultAddress, // Specify vault wallet address
      });
      
      const txHash = result?.transactionHash || result?.hash || result;
      console.log('✅ Repay transaction sent:', txHash);
      console.log('  - View on PolygonScan: https://polygonscan.com/tx/' + txHash);
      
      return txHash;
    } catch (error: any) {
      console.error('❌ Repay transaction failed:', error);
      throw new Error(error.message || 'Failed to send repay transaction');
    }
  }

  /**
   * Get credit activity history - real transactions to/from vault
   */
  async getCreditHistory(address: string) {
    try {
      const transactions = await this.getTransactionHistory(address);
      
      // Filter for credit vault transactions only
      const creditTxs = transactions.filter(tx => 
        tx.to.toLowerCase() === this.creditVaultAddress.toLowerCase()
      );
      
      if (creditTxs.length === 0) {
        return []; // Return empty array if no credit transactions
      }
      
      return creditTxs.slice(0, 10).map(tx => {
        const now = Date.now();
        const txTime = parseInt(tx.timeStamp) * 1000;
        const daysAgo = Math.floor((now - txTime) / (1000 * 60 * 60 * 24));
        
        let timeLabel;
        if (daysAgo === 0) {
          const hoursAgo = Math.floor((now - txTime) / (1000 * 60 * 60));
          timeLabel = hoursAgo === 0 ? 'Just now' : `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
        } else if (daysAgo === 1) {
          timeLabel = 'Yesterday';
        } else if (daysAgo < 7) {
          timeLabel = `${daysAgo} days ago`;
        } else if (daysAgo < 30) {
          const weeksAgo = Math.floor(daysAgo / 7);
          timeLabel = `${weeksAgo} week${weeksAgo > 1 ? 's' : ''} ago`;
        } else {
          timeLabel = new Date(txTime).toLocaleDateString();
        }
        
        return {
          type: 'borrow', // All txs to vault are borrows (repays would come from vault)
          amount: parseFloat(formatEther(tx.value)) * 600, // Convert to USD
          date: timeLabel,
          hash: tx.hash,
        };
      });
    } catch (error) {
      console.error('Error fetching credit history:', error);
      return [];
    }
  }
}

export const creditService = new CreditService();
