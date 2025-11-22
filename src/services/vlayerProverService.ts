/**
 * vlayer Web Prover Service
 * Handles server-side proof generation and verification using vlayer
 */

// Use backend proxy server to avoid CORS issues
// Backend server runs on port 3001 and proxies to vlayer
const USE_BACKEND_PROXY = true;
const BACKEND_API_URL = 'http://localhost:3001';
const VLAYER_PROVER_URL = USE_BACKEND_PROXY ? `${BACKEND_API_URL}/api/vlayer` : 'https://web-prover.vlayer.xyz/api/v1';
const VLAYER_CLIENT_ID = '4f028e97-b7c7-4a81-ade2-6b1a2917380c';
const VLAYER_AUTH_TOKEN = 'jUWXi1pVUoTHgc7MOgh5X0zMR12MHtAhtjVgMc2DM3B3Uc8WEGQAEix83VwZ';
const VLAYER_ACCESS_TOKEN = process.env.VLAYER_ACCESS_TOKEN || 
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbnZpcm9ubWVudCI6InByb2R1Y3Rpb24iLCJpYXQiOjE3NjM4MjAyMDYsImV4cCI6MTc5NTQ0MjYwNiwic3ViIjoiM0RBWHBweVdBdmF5ZXRoUWl3OHZUWld0dWJrOGlvcTRoc2ppbzQ3WFJUNmNaQXNRV2VTRVNBdEhpc3BRbHNPZmV6WjVoY3l4SUswQVdoSDhtcUV3MlE9PSJ9.GEnzk8IKVY27Hn3GmhISr8oEWXK01ZzRiAZiPeLx3iumVpTvCJYjI7NmDVuoKfYvWDc5WXGa8VvxRmU4NTg54BM26MfaK_IPIIl9lNIkZMzi7HvujR4du5ow9HDAZZmP_QTfnAadhe10oOPAcRH6zfkoGni6ci01qTgXK6vXZ-mr6SNCTWvDvuZKy7JySXoq9-UZc7k51cRV6zWXyZEb7Vi5zJVGPn60a8RDauPjjBV6SVAqXmn_YT88LW7VJ-QZolyzwmNaUTZAhrtCFziqV5JJ1QmC5IqWsZXnCnlI-gun97T9Q9mjM6q5cw46CUiqP1H7ofwrgUyXjBE6OnN7rFAvQdCj0EKeiT5Q5aH6Pj6yGz_D4qB0XTSxLT4RmlQZd-8m4_zkdqVzKb9xfsjUCq3VeWy-pWDn7kApKd_-K-bicct9v7_wFK3nO25Jps1qE4Ut6Auv5DC5snz36noS8SHl2ePmnVEJRmvaPu_l6dzZpBEV6E3q3b6vl9lvPk_nNhSNn6xgvOvxjr556jhuochRjtB4u1r3wgWTcQz_xF2568LuU5qkP7vBKDdLo5ihAe_13wxUsgSWRPv0Xa0Y0RG7v-m2mZLqQ3IlbkhfonntzamJbQM0-yytz9FZX0oslfzSHtSlJDawIzUqJuicdcNXmHtAH1shIw7D08VkT2Y';

interface ProveRequest {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  notaryUrl?: string;
}

interface ProveResponse {
  data: string; // Hex-encoded proof data
  version: string; // TLSN protocol version
  meta: {
    notaryUrl: string;
  };
}

interface VerifyResponse {
  success: boolean;
  serverDomain: string;
  notaryKeyFingerprint: string;
  request: {
    method: string;
    url: string;
    headers: [string, string][];
    body: string | null;
  };
  response: {
    status: number;
    headers: [string, string][];
    body: string;
  };
  error?: string;
}

export class VlayerProverService {
  /**
   * Generate a Web Proof using vlayer's prover server
   * POST /prove
   */
  async generateProof(request: ProveRequest): Promise<ProveResponse> {
    try {
      console.log('🔐 Generating Web Proof via vlayer:', request.url);

      // Convert headers object to array format if provided
      const headersArray = request.headers 
        ? Object.entries(request.headers).map(([key, value]) => `${key}: ${value}`)
        : [];

      // Backend proxy handles auth, so don't include headers when using proxy
      const fetchHeaders: any = {
        'Content-Type': 'application/json',
      };
      
      if (!USE_BACKEND_PROXY) {
        fetchHeaders['x-client-id'] = VLAYER_CLIENT_ID;
        fetchHeaders['Authorization'] = `Bearer ${VLAYER_AUTH_TOKEN}`;
      }

      const response = await fetch(`${VLAYER_PROVER_URL}/prove`, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({
          url: request.url,
          method: request.method || 'GET',
          headers: headersArray,
          body: request.body,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`vlayer prover error: ${error}`);
      }

      const result: ProveResponse = await response.json();
      
      console.log('✅ Web Proof generated:', {
        url: request.url,
        dataLength: result.data?.length,
        version: result.version,
      });

      return result;
    } catch (error) {
      console.error('❌ Error generating proof:', error);
      throw error;
    }
  }

  /**
   * Verify a Web Proof using vlayer's verifier
   * POST /verify
   */
  async verifyProof(presentation: ProveResponse): Promise<VerifyResponse> {
    try {
      console.log('🔍 Verifying Web Proof via vlayer');

      // Backend proxy handles auth, so don't include headers when using proxy
      const fetchHeaders: any = {
        'Content-Type': 'application/json',
      };
      
      if (!USE_BACKEND_PROXY) {
        fetchHeaders['x-client-id'] = VLAYER_CLIENT_ID;
        fetchHeaders['Authorization'] = `Bearer ${VLAYER_AUTH_TOKEN}`;
      }

      const response = await fetch(`${VLAYER_PROVER_URL}/verify`, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify(presentation),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`vlayer verifier error: ${error}`);
      }

      const result: VerifyResponse = await response.json();
      
      console.log('✅ Proof verification result:', result.success);

      return result;
    } catch (error) {
      console.error('❌ Error verifying proof:', error);
      throw error;
    }
  }

  /**
   * Generate income proof from a mock API endpoint
   * This simulates proving income from a bank/payroll API
   */
  async generateIncomeProof(walletAddress: string, incomeAmount: number): Promise<ProveResponse> {
    // For demo: Use a mock API endpoint that returns income data
    // In production: This would be the actual bank/payroll API
    const mockApiUrl = `https://api.example.com/income?wallet=${walletAddress}&amount=${incomeAmount}`;
    
    // For hackathon demo, we'll create a mock response
    const mockResponse = {
      wallet: walletAddress,
      monthlyIncome: incomeAmount,
      verified: true,
      timestamp: Date.now(),
    };

    return this.generateProof({
      url: mockApiUrl,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Generate agent performance proof from a trading dashboard API
   */
  async generateAgentPerformanceProof(
    walletAddress: string, 
    agentId: string, 
    pnl: number
  ): Promise<ProveResponse> {
    // Mock trading dashboard API
    const mockApiUrl = `https://api.trading-dashboard.com/performance?agent=${agentId}&wallet=${walletAddress}`;
    
    return this.generateProof({
      url: mockApiUrl,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Extract income bucket from verified proof data
   */
  extractIncomeBucket(verifyResult: VerifyResponse): number {
    try {
      const body = JSON.parse(verifyResult.response.body);
      const monthlyIncome = body.monthlyIncome || body.balance || 0;

      // Map to income buckets
      if (monthlyIncome >= 2000) return 2000;
      if (monthlyIncome >= 1000) return 1000;
      if (monthlyIncome >= 500) return 500;
      return 0;
    } catch (error) {
      console.error('Error extracting income bucket:', error);
      return 0;
    }
  }

  /**
   * Extract PnL bucket from verified proof data
   */
  extractPnLBucket(verifyResult: VerifyResponse): number {
    try {
      const body = JSON.parse(verifyResult.response.body);
      const pnl = body.pnl || 0;

      // Map to PnL buckets: -1 (loss), 0 (neutral), +1 (profit)
      if (pnl > 0) return 1;
      if (pnl < 0) return -1;
      return 0;
    } catch (error) {
      console.error('Error extracting PnL bucket:', error);
      return 0;
    }
  }

  /**
   * Generate and verify Binance balance proof (example for AI agents)
   */
  async generateBinanceBalanceProof(symbol: string = 'ETHUSDC'): Promise<{
    presentation: ProveResponse;
    verified: VerifyResponse;
  }> {
    try {
      console.log('🔐 Generating Binance balance proof for:', symbol);

      // Step 1: Generate proof
      const presentation = await this.generateProof({
        url: `https://data-api.binance.vision/api/v3/exchangeInfo?symbol=${symbol}`,
        method: 'GET',
      });

      // Step 2: Verify proof
      const verified = await this.verifyProof(presentation);

      if (!verified.success) {
        throw new Error('Proof verification failed');
      }

      console.log('✅ Binance proof generated and verified:', {
        domain: verified.serverDomain,
        status: verified.response.status,
      });

      return { presentation, verified };
    } catch (error) {
      console.error('❌ Error generating Binance proof:', error);
      throw error;
    }
  }
}

export const vlayerProverService = new VlayerProverService();
