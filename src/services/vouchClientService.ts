/**
 * Vouch Client-Side Proving Service
 * Uses Vouch SDK for client-side Web Proof generation
 */

import { Vouch } from '@getvouch/sdk';

// Vouch configuration
const VOUCH_CUSTOMER_ID = process.env.NEXT_PUBLIC_VOUCH_CUSTOMER_ID || '1be03be8-5014-413c-835a-feddf4020da2';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8081';

// Data source IDs
export const DATASOURCES = {
  BINANCE_BALANCE: 'a3d15595-76f0-4e2f-9fbb-e98bcbe2782a', // Binance - Proof of Balance
  WISE_TRANSACTION: '736ba397-e3dc-428d-b2f7-6bac03523edd', // Wise - Proof of Transaction
};

export class VouchClientService {
  private vouch: Vouch;

  constructor() {
    this.vouch = new Vouch();
  }

  /**
   * Generate Vouch URL for Binance balance verification
   * @param currency - Currency to verify (e.g., 'USDT', 'USDC')
   * @param requestId - Unique request ID to track this verification
   */
  getBinanceBalanceUrl(currency: string, requestId: string): string {
    // Only include webhookUrl if APP_URL uses HTTPS (required by Vouch)
    const params: any = {
      requestId,
      datasourceId: DATASOURCES.BINANCE_BALANCE,
      customerId: VOUCH_CUSTOMER_ID,
      inputs: {
        currency: currency.toUpperCase(),
      },
      redirectBackUrl: `${APP_URL}/credit?vouch=binance&requestId=${requestId}`,
    };

    // Only add webhookUrl if using HTTPS
    if (APP_URL.startsWith('https://')) {
      params.webhookUrl = `${APP_URL}/api/vouch/webhook`;
    }

    const verificationUrl = this.vouch.getStartUrl(params);

    console.log('🔗 Binance verification URL generated:', {
      requestId,
      currency,
      url: verificationUrl.toString(),
      hasWebhook: !!params.webhookUrl,
    });

    return verificationUrl.toString();
  }

  /**
   * Generate Vouch URL for Wise transaction verification
   * @param requestId - Unique request ID to track this verification
   */
  getWiseTransactionUrl(requestId: string): string {
    // Only include webhookUrl if APP_URL uses HTTPS (required by Vouch)
    const params: any = {
      requestId,
      datasourceId: DATASOURCES.WISE_TRANSACTION,
      customerId: VOUCH_CUSTOMER_ID,
      redirectBackUrl: `${APP_URL}/credit?vouch=wise&requestId=${requestId}`,
    };

    // Only add webhookUrl if using HTTPS
    if (APP_URL.startsWith('https://')) {
      params.webhookUrl = `${APP_URL}/api/vouch/webhook`;
    }

    const verificationUrl = this.vouch.getStartUrl(params);

    console.log('🔗 Wise verification URL generated:', {
      requestId,
      url: verificationUrl.toString(),
      hasWebhook: !!params.webhookUrl,
    });

    return verificationUrl.toString();
  }

  /**
   * Start Binance balance verification flow
   */
  async startBinanceVerification(currency: string = 'USDT'): Promise<{
    requestId: string;
    verificationUrl: string;
  }> {
    const requestId = crypto.randomUUID();
    const verificationUrl = this.getBinanceBalanceUrl(currency, requestId);

    return {
      requestId,
      verificationUrl,
    };
  }

  /**
   * Start Wise transaction verification flow
   */
  async startWiseVerification(): Promise<{
    requestId: string;
    verificationUrl: string;
  }> {
    const requestId = crypto.randomUUID();
    const verificationUrl = this.getWiseTransactionUrl(requestId);

    return {
      requestId,
      verificationUrl,
    };
  }

  /**
   * Get proof data from Vouch API
   */
  async getProof(requestId: string): Promise<any | null> {
    try {
      console.log('📡 Fetching proof from Vouch API:', requestId);
      
      // Use Vouch SDK to get proof status
      // Note: Vouch SDK doesn't have a direct getProof method yet
      // For now, return null to indicate proof not ready
      // In production, you'd call Vouch API or use webhook
      
      console.log('⚠️ Vouch SDK getProof not implemented yet');
      return null;
    } catch (error) {
      console.error('Error fetching proof from Vouch:', error);
      return null;
    }
  }

  /**
   * Extract income from Binance balance proof
   */
  extractIncomeFromBinance(proofData: any): number {
    try {
      // Parse the proof data to extract balance
      const balance = proofData.balance || 0;
      
      // Map balance to income bucket
      // Assume 10% of balance as monthly income
      const estimatedIncome = balance * 0.1;

      if (estimatedIncome >= 2000) return 2000;
      if (estimatedIncome >= 1000) return 1000;
      if (estimatedIncome >= 500) return 500;
      return 0;
    } catch (error) {
      console.error('Error extracting income from Binance:', error);
      return 0;
    }
  }

  /**
   * Extract income from Wise transaction proof
   */
  extractIncomeFromWise(proofData: any): number {
    try {
      // Parse the proof data to extract transaction amount
      const amount = proofData.amount || 0;
      
      // Map transaction to income bucket
      if (amount >= 2000) return 2000;
      if (amount >= 1000) return 1000;
      if (amount >= 500) return 500;
      return 0;
    } catch (error) {
      console.error('Error extracting income from Wise:', error);
      return 0;
    }
  }
}

export const vouchClientService = new VouchClientService();
