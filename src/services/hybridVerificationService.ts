/**
 * Hybrid Verification Service
 * Combines Vouch and vlayer verification via server-side API
 */

export class HybridVerificationService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
  }

  /**
   * Verify income using Vouch attestation (server-side)
   */
  async verifyWithVouch(walletAddress: string, vouchProof: any) {
    try {
      console.log('📡 Sending Vouch proof to server for verification...');

      const response = await fetch(`${this.apiUrl}/api/verify-income`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          proofType: 'vouch',
          proofData: vouchProof,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server verification failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Server verification result:', result);

      return result;
    } catch (error) {
      console.error('Error verifying with Vouch:', error);
      throw error;
    }
  }

  /**
   * Verify income using vlayer proof (server-side)
   */
  async verifyWithVlayer(walletAddress: string, vlayerProof: any) {
    try {
      console.log('📡 Sending vlayer proof to server for verification...');

      const response = await fetch(`${this.apiUrl}/api/verify-income`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          proofType: 'vlayer',
          proofData: vlayerProof,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server verification failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Server verification result:', result);

      return result;
    } catch (error) {
      console.error('Error verifying with vlayer:', error);
      throw error;
    }
  }

  /**
   * Verify income using both Vouch and vlayer (hybrid approach)
   */
  async verifyHybrid(walletAddress: string, vouchProof: any, vlayerProof: any) {
    try {
      console.log('📡 Sending hybrid proof to server for verification...');

      const response = await fetch(`${this.apiUrl}/api/verify-income`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          proofType: 'hybrid',
          proofData: {
            vouchProof,
            vlayerProof,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server verification failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Hybrid verification result:', result);

      return result;
    } catch (error) {
      console.error('Error with hybrid verification:', error);
      throw error;
    }
  }

  /**
   * Get verification status
   */
  async getVerificationStatus(walletAddress: string) {
    try {
      const response = await fetch(`${this.apiUrl}/api/verify-income/status?wallet=${walletAddress}`);
      
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting verification status:', error);
      return null;
    }
  }
}

// Export singleton instance
export const hybridVerificationService = new HybridVerificationService();
