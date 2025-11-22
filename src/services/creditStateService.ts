/**
 * Credit State Management Service
 * Tracks borrowed amounts, repayments, interest, and credit utilization
 * For hackathon demo - uses localStorage for persistence
 */

interface CreditState {
  walletAddress: string;
  totalBorrowed: number; // Total ever borrowed
  totalRepaid: number; // Total ever repaid
  outstandingBalance: number; // Current debt
  lastBorrowDate: number | null;
  lastRepayDate: number | null;
  creditLimit: number;
  apr: number;
  draws: Draw[];
  repayments: Repayment[];
  autoRepayEnabled: boolean;
  delinquentDays: number;
}

interface Draw {
  id: string;
  amount: number;
  timestamp: number;
  txHash: string;
  interestRate: number;
}

interface Repayment {
  id: string;
  amount: number;
  timestamp: number;
  txHash: string;
  appliedToInterest: number;
  appliedToPrincipal: number;
}

export class CreditStateService {
  private storageKey = 'proteus_credit_state';

  /**
   * Get credit state for a wallet
   */
  getCreditState(walletAddress: string): CreditState {
    const stored = localStorage.getItem(`${this.storageKey}_${walletAddress.toLowerCase()}`);
    
    if (stored) {
      return JSON.parse(stored);
    }

    // Initialize new credit state
    return {
      walletAddress: walletAddress.toLowerCase(),
      totalBorrowed: 0,
      totalRepaid: 0,
      outstandingBalance: 0,
      lastBorrowDate: null,
      lastRepayDate: null,
      creditLimit: 0,
      apr: 12.5,
      draws: [],
      repayments: [],
      autoRepayEnabled: true,
      delinquentDays: 0,
    };
  }

  /**
   * Save credit state
   */
  private saveCreditState(state: CreditState): void {
    localStorage.setItem(
      `${this.storageKey}_${state.walletAddress.toLowerCase()}`,
      JSON.stringify(state)
    );
  }

  /**
   * Record a borrow (draw)
   */
  recordBorrow(
    walletAddress: string,
    amount: number,
    txHash: string,
    apr: number
  ): CreditState {
    const state = this.getCreditState(walletAddress);
    
    const draw: Draw = {
      id: `draw_${Date.now()}`,
      amount,
      timestamp: Date.now(),
      txHash,
      interestRate: apr,
    };

    state.draws.push(draw);
    state.totalBorrowed += amount;
    state.outstandingBalance += amount;
    state.lastBorrowDate = Date.now();

    this.saveCreditState(state);
    return state;
  }

  /**
   * Record a repayment
   */
  recordRepayment(
    walletAddress: string,
    amount: number,
    txHash: string
  ): CreditState {
    const state = this.getCreditState(walletAddress);
    
    // Calculate interest accrued
    const interest = this.calculateAccruedInterest(state);
    
    // Apply payment: interest first, then principal
    let appliedToInterest = Math.min(amount, interest);
    let appliedToPrincipal = amount - appliedToInterest;

    const repayment: Repayment = {
      id: `repay_${Date.now()}`,
      amount,
      timestamp: Date.now(),
      txHash,
      appliedToInterest,
      appliedToPrincipal,
    };

    state.repayments.push(repayment);
    state.totalRepaid += amount;
    state.outstandingBalance = Math.max(0, state.outstandingBalance - appliedToPrincipal);
    state.lastRepayDate = Date.now();
    state.delinquentDays = 0; // Reset delinquency

    this.saveCreditState(state);
    return state;
  }

  /**
   * Calculate accrued interest
   */
  calculateAccruedInterest(state: CreditState): number {
    if (state.outstandingBalance === 0 || !state.lastBorrowDate) {
      return 0;
    }

    const now = Date.now();
    const daysSinceBorrow = (now - state.lastBorrowDate) / (1000 * 60 * 60 * 24);
    
    // Simple interest: Principal × Rate × Time
    // APR / 365 = daily rate
    const dailyRate = state.apr / 100 / 365;
    const interest = state.outstandingBalance * dailyRate * daysSinceBorrow;
    
    return Math.round(interest * 100) / 100; // Round to 2 decimals
  }

  /**
   * Get current outstanding balance with interest
   */
  getCurrentBalance(walletAddress: string): {
    principal: number;
    interest: number;
    total: number;
  } {
    const state = this.getCreditState(walletAddress);
    const interest = this.calculateAccruedInterest(state);
    
    return {
      principal: state.outstandingBalance,
      interest,
      total: state.outstandingBalance + interest,
    };
  }

  /**
   * Get credit utilization percentage
   */
  getCreditUtilization(walletAddress: string): number {
    const state = this.getCreditState(walletAddress);
    const balance = this.getCurrentBalance(walletAddress);
    
    if (state.creditLimit === 0) return 0;
    
    return Math.round((balance.total / state.creditLimit) * 100);
  }

  /**
   * Update credit limit
   */
  updateCreditLimit(walletAddress: string, newLimit: number, apr: number): void {
    const state = this.getCreditState(walletAddress);
    state.creditLimit = newLimit;
    state.apr = apr;
    this.saveCreditState(state);
  }

  /**
   * Check if auto-repay should trigger
   */
  shouldAutoRepay(walletAddress: string, incomingAmount: number): {
    shouldRepay: boolean;
    repayAmount: number;
    withholdRate: number;
  } {
    const state = this.getCreditState(walletAddress);
    
    if (!state.autoRepayEnabled || state.outstandingBalance === 0) {
      return { shouldRepay: false, repayAmount: 0, withholdRate: 0 };
    }

    // Calculate withhold rate based on delinquency
    let withholdRate = 0.30; // Default 30%
    
    if (state.delinquentDays > 30) {
      withholdRate = 1.00; // 100% withhold
    } else if (state.delinquentDays > 7) {
      withholdRate = 0.80; // 80% withhold
    }

    const repayAmount = Math.min(
      incomingAmount * withholdRate,
      this.getCurrentBalance(walletAddress).total
    );

    return {
      shouldRepay: repayAmount > 0,
      repayAmount,
      withholdRate,
    };
  }

  /**
   * Get credit history summary
   */
  getCreditSummary(walletAddress: string) {
    const state = this.getCreditState(walletAddress);
    const balance = this.getCurrentBalance(walletAddress);
    const utilization = this.getCreditUtilization(walletAddress);

    return {
      creditLimit: state.creditLimit,
      used: balance.total,
      available: Math.max(0, state.creditLimit - balance.total),
      utilization,
      outstandingPrincipal: balance.principal,
      accruedInterest: balance.interest,
      totalBorrowed: state.totalBorrowed,
      totalRepaid: state.totalRepaid,
      apr: state.apr,
      autoRepayEnabled: state.autoRepayEnabled,
      delinquentDays: state.delinquentDays,
      drawCount: state.draws.length,
      repaymentCount: state.repayments.length,
    };
  }

  /**
   * Get all draws and repayments for history
   */
  getTransactionHistory(walletAddress: string): Array<{
    type: 'borrow' | 'repay';
    amount: number;
    date: string;
    hash: string;
    details?: string;
  }> {
    const state = this.getCreditState(walletAddress);
    
    const allTxs = [
      ...state.draws.map(d => ({
        type: 'borrow' as const,
        amount: d.amount,
        timestamp: d.timestamp,
        date: this.formatDate(d.timestamp),
        hash: d.txHash,
        details: `APR: ${d.interestRate}%`,
      })),
      ...state.repayments.map(r => ({
        type: 'repay' as const,
        amount: r.amount,
        timestamp: r.timestamp,
        date: this.formatDate(r.timestamp),
        hash: r.txHash,
        details: `Interest: $${r.appliedToInterest.toFixed(2)}, Principal: $${r.appliedToPrincipal.toFixed(2)}`,
      })),
    ];

    // Sort by timestamp descending
    return allTxs.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Format timestamp to readable date
   */
  private formatDate(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    return new Date(timestamp).toLocaleDateString();
  }

  /**
   * Clear credit state (for testing)
   */
  clearCreditState(walletAddress: string): void {
    localStorage.removeItem(`${this.storageKey}_${walletAddress.toLowerCase()}`);
  }
}

export const creditStateService = new CreditStateService();
