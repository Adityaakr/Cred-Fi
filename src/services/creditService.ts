import { ethers } from 'ethers';

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
  private rpcUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
  private apiUrl = 'https://api-testnet.bscscan.com/api';
  private apiKey = 'YourApiKeyToken'; // BscScan API key (optional for testnet)
  private creditVaultAddress = '0x5a26514ce0af943540407170b09cea03cbff5570'; // Credit vault contract

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
      const value = parseFloat(ethers.utils.formatEther(tx.value));
      
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
   * Borrow USDT - sends transaction to credit vault
   */
  async borrow(
    walletAddress: string,
    amount: number,
    sendTransaction: any
  ): Promise<string> {
    try {
      console.log('🏦 Borrowing', amount, 'USDT to vault:', this.creditVaultAddress);
      
      // Send transaction to credit vault address with specific wallet
      const result = await sendTransaction(
        {
          to: this.creditVaultAddress,
          value: '100000000000000', // 0.0001 usdc in wei
          chainId: 97,
        },
        {
          address: '0x9C6CCbC95c804C3FB0024e5f10e2e978855280B3'
        }
      );
      
      console.log('✅ Borrow transaction:', result);
      
      return result?.transactionHash || result?.hash || result || 'success';
    } catch (error: any) {
      console.error('❌ Borrow failed:', error);
      throw new Error(error.message || 'Failed to borrow');
    }
  }

  /**
   * Repay USDT - sends transaction to credit vault
   */
  async repay(
    walletAddress: string,
    amount: number,
    sendTransaction: any
  ): Promise<string> {
    try {
      console.log('💰 Repaying', amount, 'USDT to vault:', this.creditVaultAddress);
      
      // Send transaction to credit vault address with specific wallet
      const result = await sendTransaction(
        {
          to: this.creditVaultAddress,
          value: '100000000000000', // 0.0001 usdc in wei
          chainId: 97,
        },
        {
          address: '0x9C6CCbC95c804C3FB0024e5f10e2e978855280B3'
        }
      );
      
      console.log('✅ Repay transaction:', result);
      
      return result?.transactionHash || result?.hash || result || 'success';
    } catch (error: any) {
      console.error('❌ Repay failed:', error);
      throw new Error(error.message || 'Failed to repay');
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
          amount: parseFloat(ethers.utils.formatEther(tx.value)) * 600, // Convert to USD
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
