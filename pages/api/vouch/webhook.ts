/**
 * POST /api/vouch/webhook
 * Receives proof data from Vouch after user completes verification
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory proof storage (use Redis/DB in production)
const proofStore = new Map<string, {
  proof: any;
  publicInputs: any;
  metadata: any;
  timestamp: number;
}>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature (important for production!)
    const signature = req.headers['x-vouch-signature'] as string;
    const webhookSecret = process.env.VOUCH_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      // In production, verify the signature:
      // const isValid = verifyVouchSignature(req.body, signature, webhookSecret);
      // if (!isValid) {
      //   return res.status(401).json({ error: 'Invalid signature' });
      // }
    }

    const { requestId, proof, publicInputs, metadata, status } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'requestId is required' });
    }

    // Only store successful proofs
    if (status === 'completed' && proof) {
      proofStore.set(requestId, {
        proof,
        publicInputs,
        metadata,
        timestamp: Date.now(),
      });

      console.log('✅ Proof received and stored:', {
        requestId,
        verificationType: metadata?.verificationType,
        walletAddress: metadata?.walletAddress,
      });

      return res.status(200).json({
        success: true,
        message: 'Proof stored successfully',
      });
    }

    // Handle failed verifications
    if (status === 'failed') {
      console.log('❌ Verification failed:', {
        requestId,
        metadata,
      });

      return res.status(200).json({
        success: false,
        message: 'Verification failed',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook received',
    });
  } catch (error: any) {
    console.error('❌ Error processing webhook:', error);
    return res.status(500).json({
      error: 'Failed to process webhook',
      message: error.message,
    });
  }
}

// Cleanup old proofs (keep for 24 hours)
setInterval(() => {
  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  
  for (const [requestId, data] of proofStore.entries()) {
    if (now - data.timestamp > TWENTY_FOUR_HOURS) {
      proofStore.delete(requestId);
    }
  }
}, 60 * 60 * 1000); // Every hour

// Export store
export { proofStore };
