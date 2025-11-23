/**
 * Wise Server Service
 * Client-side service to fetch real Wise income data via server API
 */

export class WiseServerService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8081';
  }

  /**
   * Fetch real income data from Wise via server API
   * Combines Wise API data with Vouch attestation verification
   */
  async fetchIncome(walletAddress: string, wiseProfileId?: string, attestationUid?: string) {
    try {
      console.log('📡 Fetching Wise income from server...');

      const response = await fetch(`${this.apiUrl}/api/wise-income`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          wiseProfileId,
          attestationUid: attestationUid || '4a443312-1e92-4080-b0e5-3d5a1a46930b',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Wise income fetched:', result);

      return result;
    } catch (error: any) {
      console.error('Error fetching Wise income:', error);
      throw error;
    }
  }

  /**
   * Get cached income data for a wallet
   */
  getCachedIncome(walletAddress: string) {
    try {
      const cached = localStorage.getItem(`wise_income_${walletAddress}`);
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is less than 1 hour old
        const cacheAge = Date.now() - new Date(data.timestamp).getTime();
        if (cacheAge < 3600000) { // 1 hour
          console.log('📦 Using cached Wise income data');
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error reading cached income:', error);
      return null;
    }
  }

  /**
   * Cache income data
   */
  cacheIncome(walletAddress: string, data: any) {
    try {
      localStorage.setItem(`wise_income_${walletAddress}`, JSON.stringify(data));
      console.log('💾 Wise income data cached');
    } catch (error) {
      console.error('Error caching income:', error);
    }
  }
}

// Export singleton instance
export const wiseServerService = new WiseServerService();
