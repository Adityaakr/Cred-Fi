/**
 * Server-side API endpoint for income verification
 * Combines Vouch attestation verification with vlayer proof verification
 */

import { Vouch } from '@getvouch/sdk';
import { VOUCH_USDC } from '../src/services/vouchClientService';

// Initialize Vouch SDK for server-side verification
const vouchServer = new Vouch({
  customerId: VOUCH_USDC,
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, proofType, proofData } = req.body;

    if (!walletAddress || !proofType || !proofData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let verificationResult;

    // Handle different proof types
    switch (proofType) {
      case 'vouch':
        // Verify Vouch attestation
        verificationResult = await verifyVouchAttestation(proofData);
        break;

      case 'vlayer':
        // Verify vlayer proof
        verificationResult = await verifyVlayerProof(proofData);
        break;

      case 'hybrid':
        // Combine both Vouch and vlayer verification
        const vouchResult = await verifyVouchAttestation(proofData.vouchProof);
        const vlayerResult = await verifyVlayerProof(proofData.vlayerProof);
        
        verificationResult = {
          verified: vouchResult.verified && vlayerResult.verified,
          income: Math.max(vouchResult.income, vlayerResult.income),
          sources: {
            vouch: vouchResult,
            vlayer: vlayerResult,
          },
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid proof type' });
    }

    // Calculate credit limit based on verified income
    const creditLimit = calculateCreditLimit(verificationResult.income);

    return res.status(200).json({
      success: true,
      verified: verificationResult.verified,
      income: verificationResult.income,
      creditLimit,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error verifying income:', error);
    return res.status(500).json({ error: error.message || 'Verification failed' });
  }
}

/**
 * Verify Vouch attestation
 */
async function verifyVouchAttestation(proofData: any) {
  try {
    console.log('🔍 Verifying Vouch attestation...');

    // Verify the attestation using Vouch SDK
    // In production, you would call Vouch API to verify the attestation
    const attestationUid = proofData.attestationUid || proofData.requestId;
    
    // Mock verification for demo
    // In production: const verification = await vouchServer.verifyAttestation(attestationUid);
    
    const income = proofData.metadata?.income || proofData.data?.balance || 0;

    return {
      verified: true,
      income,
      source: 'vouch',
      attestationUid,
    };
  } catch (error) {
    console.error('Vouch verification failed:', error);
    return {
      verified: false,
      income: 0,
      error: error.message,
    };
  }
}

/**
 * Verify vlayer proof
 */
async function verifyVlayerProof(proofData: any) {
  try {
    console.log('🔍 Verifying vlayer proof...');

    // Verify the vlayer proof
    // In production, you would verify the ZK proof on-chain or via vlayer API
    const income = proofData.income || proofData.totalIncome || 0;

    return {
      verified: true,
      income,
      source: 'vlayer',
      proofHash: proofData.proofHash,
    };
  } catch (error) {
    console.error('vlayer verification failed:', error);
    return {
      verified: false,
      income: 0,
      error: error.message,
    };
  }
}

/**
 * Calculate credit limit based on verified income
 */
function calculateCreditLimit(income: number): number {
  // Convert INR to USDT (1 USDT ≈ 83 INR)
  const usdtEquivalent = income / 83;
  
  // Credit limit = 5% of income
  const creditInUSDT = Math.floor(usdtEquivalent * 0.05);
  
  // Minimum 3 USDT, maximum 100 USDT
  if (income === 0 || creditInUSDT < 3) {
    return 3;
  }
  
  return Math.min(100, creditInUSDT);
}
