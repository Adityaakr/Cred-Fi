/**
 * GET /api/vouch/proof/:requestId
 * Retrieves stored proof for onchain submission
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { proofStore } from '../webhook';
import { requestStore } from '../human/start';
import { agentRequestStore } from '../agent/start';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { requestId } = req.query;

    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ error: 'requestId is required' });
    }

    // Get proof from store
    const proofData = proofStore.get(requestId);

    if (!proofData) {
      return res.status(404).json({ 
        error: 'Proof not found',
        message: 'Proof may not be ready yet or has expired'
      });
    }

    // Get request metadata
    const humanRequest = requestStore.get(requestId);
    const agentRequest = agentRequestStore.get(requestId);

    const metadata = humanRequest || agentRequest;

    console.log('✅ Proof retrieved:', {
      requestId,
      verificationType: proofData.metadata?.verificationType,
      hasProof: !!proofData.proof,
    });

    return res.status(200).json({
      success: true,
      requestId,
      proof: proofData.proof,
      publicInputs: proofData.publicInputs,
      metadata: {
        ...proofData.metadata,
        ...metadata,
      },
      timestamp: proofData.timestamp,
    });
  } catch (error: any) {
    console.error('❌ Error retrieving proof:', error);
    return res.status(500).json({
      error: 'Failed to retrieve proof',
      message: error.message,
    });
  }
}
