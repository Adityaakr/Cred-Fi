/**
 * 🤖 Real Hedera AI Agent API (Next.js)
 * 
 * This is a server-side API that uses the actual Hedera Agent Kit
 * to execute real blockchain transactions with AI decision making.
 * 
 * Endpoints:
 * - POST /api/hedera-agent/analyze - Analyze market opportunity
 * - POST /api/hedera-agent/execute - Execute trade
 * - GET /api/hedera-agent/balance - Get account balance
 * - GET /api/hedera-agent/status - Get agent status
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { Client, PrivateKey } from '@hashgraph/sdk';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { HederaLangchainToolkit, coreQueriesPlugin, coreAccountPlugin } from 'hedera-agent-kit';

// Initialize Hedera client (singleton)
let hederaClient: Client | null = null;
let agentExecutor: AgentExecutor | null = null;

function getHederaClient() {
  if (!hederaClient) {
    const accountId = process.env.HEDERA_ACCOUNT_ID || '0.0.7307730';
    const privateKey = process.env.HEDERA_PRIVATE_KEY || '0x81036ab7f571170ce9a71aad98ea9d5e310b7382ca181c24c23f6f8d3b434261';
    
    hederaClient = Client.forTestnet().setOperator(
      accountId,
      PrivateKey.fromStringECDSA(privateKey)
    );
  }
  return hederaClient;
}

async function getAgentExecutor() {
  if (!agentExecutor) {
    // Initialize OpenAI
    const llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize Hedera toolkit
    const client = getHederaClient();
    const toolkit = new HederaLangchainToolkit({
      client,
      configuration: {
        plugins: [coreQueriesPlugin, coreAccountPlugin],
      },
    });

    // Create prompt
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are an expert DeFi trading agent on Hedera network. 
      You analyze market opportunities and execute trades autonomously.
      Always consider risk levels and provide clear reasoning for your decisions.`],
      ['placeholder', '{chat_history}'],
      ['human', '{input}'],
      ['placeholder', '{agent_scratchpad}'],
    ]);

    // Get tools
    const tools = toolkit.getTools();

    // Create agent
    const agent = createToolCallingAgent({
      llm,
      tools,
      prompt,
    });

    // Create executor
    agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
    });
  }
  return agentExecutor;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const action = query.action as string;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(action, res);
      case 'POST':
        return await handlePost(action, req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGet(action: string, res: NextApiResponse) {
  switch (action) {
    case 'balance': {
      const executor = await getAgentExecutor();
      const response = await executor.invoke({ 
        input: "What is my HBAR balance?" 
      });
      return res.status(200).json({ 
        success: true,
        data: response 
      });
    }

    case 'status': {
      const client = getHederaClient();
      return res.status(200).json({
        success: true,
        data: {
          connected: true,
          network: 'testnet',
          accountId: process.env.HEDERA_ACCOUNT_ID,
          agentReady: agentExecutor !== null,
        }
      });
    }

    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}

async function handlePost(action: string, req: NextApiRequest, res: NextApiResponse) {
  const { body } = req;

  switch (action) {
    case 'analyze': {
      const { strategy, marketData } = body;
      
      const executor = await getAgentExecutor();
      const prompt = `Analyze this ${strategy} opportunity: ${JSON.stringify(marketData)}. 
      Should we execute this trade? Consider risk, expected return, and market conditions.
      Provide a clear recommendation with reasoning.`;
      
      const response = await executor.invoke({ input: prompt });
      
      return res.status(200).json({
        success: true,
        data: {
          analysis: response.output,
          recommendation: response.output.toLowerCase().includes('yes') || response.output.toLowerCase().includes('execute'),
        }
      });
    }

    case 'execute': {
      const { action: tradeAction, amount, recipient } = body;
      
      const executor = await getAgentExecutor();
      
      let prompt = '';
      switch (tradeAction) {
        case 'transfer':
          prompt = `Transfer ${amount} HBAR to account ${recipient}`;
          break;
        case 'swap':
          prompt = `Execute a swap of ${amount} tokens`;
          break;
        default:
          return res.status(400).json({ error: 'Invalid trade action' });
      }
      
      const response = await executor.invoke({ input: prompt });
      
      return res.status(200).json({
        success: true,
        data: {
          executed: true,
          result: response.output,
          timestamp: Date.now(),
        }
      });
    }

    case 'query': {
      const { question } = body;
      
      const executor = await getAgentExecutor();
      const response = await executor.invoke({ input: question });
      
      return res.status(200).json({
        success: true,
        data: response
      });
    }

    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}
