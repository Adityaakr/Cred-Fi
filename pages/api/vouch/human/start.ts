/**
 * POST /api/vouch/human/start
 * Creates a Vouch session for human income verification
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { Vouch } from '@getvouch/sdk';

// In-memory storage for request mapping (use Redis/DB in production)
const requestStore = new Map<string, { walletAddress: string; timestamp: number }>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress is required' });
    }

    // Initialize Vouch SDK
    const vouch = new Vouch({
      apiKey: process.env.VOUCH_API_KEY!,
      environment: process.env.VOUCH_ENV || 'production',
    });

    // Create Vouch session for income verification
    // This uses a pre-configured datasource in Vouch dashboard
    const session = await vouch.createSession({
      datasourceId: process.env.VOUCH_INCOME_DATASOURCE_ID!,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/credit?vouch=income`,
      metadata: {
        walletAddress,
        verificationType: 'income',
      },
    });

    // Store mapping of requestId to wallet address
    requestStore.set(session.requestId, {
      walletAddress,
      timestamp: Date.now(),
    });

    console.log('✅ Income verification session created:', {
      requestId: session.requestId,
      walletAddress,
    });

    return res.status(200).json({
      success: true,
      requestId: session.requestId,
      redirectUrl: session.url,
    });
  } catch (error: any) {
    console.error('❌ Error creating income verification session:', error);
    return res.status(500).json({
      error: 'Failed to create verification session',
      message: error.message,
    });
  }
}

// Cleanup old entries (run periodically)
setInterval(() => {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  
  for (const [requestId, data] of requestStore.entries()) {
    if (now - data.timestamp > ONE_HOUR) {
      requestStore.delete(requestId);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Export store for use in other routes
export { requestStore };
