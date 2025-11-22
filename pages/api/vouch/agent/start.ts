/**
 * POST /api/vouch/agent/start
 * Creates a Vouch session for AI agent performance verification
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { Vouch } from '@getvouch/sdk';

// In-memory storage for agent verification requests
const agentRequestStore = new Map<string, { 
  walletAddress: string; 
  agentId: string;
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
    const { walletAddress, agentId, agentName } = req.body;

    if (!walletAddress || !agentId) {
      return res.status(400).json({ 
        error: 'walletAddress and agentId are required' 
      });
    }

    // Initialize Vouch SDK
    const vouch = new Vouch({
      apiKey: process.env.VOUCH_API_KEY!,
      environment: process.env.VOUCH_ENV || 'production',
    });

    // Create Vouch session for agent performance verification
    // This datasource should verify agent PnL/performance from a dashboard/API
    const session = await vouch.createSession({
      datasourceId: process.env.VOUCH_AGENT_DATASOURCE_ID!,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/credit?vouch=agent&agentId=${agentId}`,
      metadata: {
        walletAddress,
        agentId,
        agentName: agentName || `Agent ${agentId.slice(0, 8)}`,
        verificationType: 'agent_performance',
      },
    });

    // Store mapping
    agentRequestStore.set(session.requestId, {
      walletAddress,
      agentId,
      timestamp: Date.now(),
    });

    console.log('✅ Agent performance verification session created:', {
      requestId: session.requestId,
      walletAddress,
      agentId,
    });

    return res.status(200).json({
      success: true,
      requestId: session.requestId,
      redirectUrl: session.url,
      agentId,
    });
  } catch (error: any) {
    console.error('❌ Error creating agent verification session:', error);
    return res.status(500).json({
      error: 'Failed to create agent verification session',
      message: error.message,
    });
  }
}

// Cleanup old entries
setInterval(() => {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  
  for (const [requestId, data] of agentRequestStore.entries()) {
    if (now - data.timestamp > ONE_HOUR) {
      agentRequestStore.delete(requestId);
    }
  }
}, 5 * 60 * 1000);

// Export store
export { agentRequestStore };
