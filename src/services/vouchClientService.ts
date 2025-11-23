/**
 * Vouch Client-Side Proving Service
 * Uses Vouch SDK for client-side Web Proof generation
 */

import { Vouch } from '@getvouch/sdk';

// Vouch configuration
const VOUCH_CUSTOMER_ID = process.env.NEXT_PUBLIC_VOUCH_CUSTOMER_ID || '1be03be8-5014-413c-835a-feddf4020da2';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8081';

// Export for server-side usage
export const VOUCH_USDC = process.env.NEXT_PUBLIC_VOUCH_USDC || '1be03be8-5014-413c-835a-feddf4020da2';

// Data source IDs
export const DATASOURCES = {
  BINANCE_BALANCE: 'a3d15595-76f0-4e2f-9fbb-e98bcbe2782a', // Binance - Proof of Balance
  WISE_TRANSACTION: '736ba397-e3dc-428d-b2f7-6bac03523edd', // Wise - Proof of Transaction
  WISE_INCOME: '4a443312-1e92-4080-b0e5-3d5a1a46930b', // Wise - Proof of Income (Attestation UID)
};

export class VouchClientService {
  private vouch: Vouch;

  constructor() {
    // Initialize Vouch SDK
    // Note: The "edit mode" warning is normal in development
    // It means you're using test/development data sources
    // In production, use verified data source IDs from Vouch dashboard
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
   * Start Wise income verification flow using attestation UID
   */
  async startWiseIncomeVerification(attestationUid: string): Promise<{
    requestId: string;
    verificationUrl: string;
  }> {
    const requestId = crypto.randomUUID();
    
    // Use the attestation UID as datasource ID for income proof
    const params: any = {
      requestId,
      datasourceId: attestationUid,
      customerId: VOUCH_CUSTOMER_ID,
      redirectBackUrl: `${APP_URL}/credit?vouch=wise-income&requestId=${requestId}`,
    };

    // Only add webhookUrl if using HTTPS
    if (APP_URL.startsWith('https://')) {
      params.webhookUrl = `${APP_URL}/api/vouch/webhook`;
    }

    const verificationUrl = this.vouch.getStartUrl(params);

    console.log('🔗 Wise income verification URL generated:', {
      requestId,
      attestationUid,
      url: verificationUrl.toString(),
      hasWebhook: !!params.webhookUrl,
    });

    return {
      requestId,
      verificationUrl: verificationUrl.toString(),
    };
  }

  /**
   * Get REAL proof data from Vouch API
   * Fetches actual attestation data from Vouch's API
   */
  async getProof(requestId: string): Promise<any | null> {
    try {
      console.log('📡 Fetching REAL proof from Vouch API:', requestId);
      
      // Try multiple API endpoints (Vouch API structure may vary)
      const endpoints = [
        `https://verify.vouch.io/api/attestations/${requestId}`,
        `https://api.vouch.io/attestations/${requestId}`,
        `https://vouch.io/api/v1/attestations/${requestId}`,
      ];

      let attestationData = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log('🔍 Trying endpoint:', endpoint);
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            attestationData = await response.json();
            console.log('✅ REAL attestation data received from:', endpoint, attestationData);
            break;
          } else if (response.status === 404) {
            console.log('⏳ Attestation not found at:', endpoint);
            continue;
          } else {
            console.warn('⚠️ API error at', endpoint, ':', response.status);
            continue;
          }
        } catch (err: any) {
          console.warn('⚠️ Failed to fetch from', endpoint, ':', err.message);
          lastError = err;
          continue;
        }
      }

      if (!attestationData) {
        console.log('⏳ Attestation not ready yet (tried all endpoints)');
        return null;
      }

      // Parse the attestation to extract income/balance
      // Vouch attestations have a specific schema
      const attestation = attestationData.attestation || attestationData;
      
      console.log('🔍 Full attestation object:', JSON.stringify(attestation, null, 2));
      
      // Extract the actual data from the attestation
      let income = 0;
      let balance = 0;
      
      // Try multiple data extraction methods
      
      // Method 1: decodedDataJson (most common)
      if (attestation.decodedDataJson) {
        try {
          const decodedData = typeof attestation.decodedDataJson === 'string' 
            ? JSON.parse(attestation.decodedDataJson) 
            : attestation.decodedDataJson;
          
          console.log('📊 Decoded attestation data:', decodedData);
          
          // Try different field names for income/balance
          income = parseFloat(decodedData.totalIncome || 
                   decodedData.income || 
                   decodedData.total_balance || 
                   decodedData.balance || 
                   decodedData.amount ||
                   decodedData.value ||
                   0);
          
          balance = parseFloat(decodedData.balance || 
                    decodedData.total_balance || 
                    decodedData.amount ||
                    income ||
                    0);
        } catch (err) {
          console.error('Error parsing decodedDataJson:', err);
        }
      }

      // Method 2: Raw data field
      if (income === 0 && attestation.data) {
        try {
          const rawData = typeof attestation.data === 'string' 
            ? JSON.parse(attestation.data) 
            : attestation.data;
          
          console.log('📊 Raw attestation data:', rawData);
          
          income = parseFloat(rawData.totalIncome || 
                   rawData.income || 
                   rawData.balance || 
                   rawData.amount ||
                   rawData.value ||
                   0);
          
          balance = parseFloat(rawData.balance || income || 0);
        } catch (err) {
          console.error('Error parsing raw data:', err);
        }
      }

      // Method 3: Direct fields on attestation
      if (income === 0) {
        income = parseFloat(attestation.totalIncome || 
                 attestation.income || 
                 attestation.balance || 
                 attestation.amount ||
                 0);
        balance = parseFloat(attestation.balance || income || 0);
      }

      console.log('💰 Extracted income:', income, 'INR, balance:', balance, 'INR');

      return {
        requestId,
        status: 'verified',
        timestamp: attestation.time || new Date().toISOString(),
        attestationUid: attestation.uid || requestId,
        metadata: {
          income: income,
          balance: balance,
          currency: 'INR',
          source: 'wise',
          verified: true,
        },
        data: {
          balance: balance,
          accountVerified: true,
          verificationMethod: 'vouch-attestation',
          attestationUid: attestation.uid || requestId,
        },
        rawAttestation: attestation,
      };
    } catch (error: any) {
      console.error('❌ Error fetching proof from Vouch:', error);
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
