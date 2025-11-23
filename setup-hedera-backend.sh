#!/bin/bash

echo "🚀 Setting up Real Hedera AI Agent Backend (Next.js)"
echo ""
echo "This will create a separate Next.js backend that uses the REAL Hedera Agent Kit"
echo ""

# Create backend directory
mkdir -p hedera-backend
cd hedera-backend

# Initialize Next.js project
echo "📦 Creating Next.js project..."
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Install Hedera Agent Kit dependencies
echo ""
echo "📦 Installing Hedera Agent Kit..."
npm install hedera-agent-kit @hashgraph/sdk
npm install @langchain/core@^0.3 langchain@^0.3
npm install @langchain/openai@^0.6

# Create API directory
mkdir -p app/api/hedera-agent

# Copy API route
echo ""
echo "📝 Creating API route..."
cat > app/api/hedera-agent/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { Client, PrivateKey } from '@hashgraph/sdk';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { 
  HederaLangchainToolkit, 
  coreQueriesPlugin, 
  coreAccountPlugin 
} from 'hedera-agent-kit';

let hederaClient: Client | null = null;
let agentExecutor: AgentExecutor | null = null;

function getHederaClient() {
  if (!hederaClient) {
    hederaClient = Client.forTestnet().setOperator(
      process.env.HEDERA_ACCOUNT_ID!,
      PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!)
    );
  }
  return hederaClient;
}

async function getAgentExecutor() {
  if (!agentExecutor) {
    const llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const client = getHederaClient();
    const toolkit = new HederaLangchainToolkit({
      client,
      configuration: {
        plugins: [coreQueriesPlugin, coreAccountPlugin],
      },
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', 'You are an expert DeFi trading agent on Hedera network.'],
      ['placeholder', '{chat_history}'],
      ['human', '{input}'],
      ['placeholder', '{agent_scratchpad}'],
    ]);

    const tools = toolkit.getTools();
    const agent = createToolCallingAgent({ llm, tools, prompt });
    agentExecutor = new AgentExecutor({ agent, tools, verbose: true });
  }
  return agentExecutor;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    if (action === 'balance') {
      const executor = await getAgentExecutor();
      const response = await executor.invoke({ input: "What is my HBAR balance?" });
      return NextResponse.json({ success: true, data: response });
    }
    
    if (action === 'status') {
      return NextResponse.json({
        success: true,
        data: {
          connected: true,
          network: 'testnet',
          accountId: process.env.HEDERA_ACCOUNT_ID,
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const body = await request.json();

  try {
    if (action === 'analyze') {
      const { strategy, marketData } = body;
      const executor = await getAgentExecutor();
      
      const prompt = `Analyze this ${strategy} opportunity: ${JSON.stringify(marketData)}. 
      Should we execute? Provide recommendation with reasoning.`;
      
      const response = await executor.invoke({ input: prompt });
      return NextResponse.json({ success: true, data: response });
    }

    if (action === 'execute') {
      const { command } = body;
      const executor = await getAgentExecutor();
      const response = await executor.invoke({ input: command });
      return NextResponse.json({ success: true, data: response });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
EOF

# Copy environment variables from parent
echo ""
echo "📝 Setting up environment variables..."
cat > .env.local << EOF
# OpenAI API Key
OPENAI_API_KEY=your-openai-key-here

# Hedera Credentials
HEDERA_ACCOUNT_ID=0.0.7307730
HEDERA_PRIVATE_KEY=0x81036ab7f571170ce9a71aad98ea9d5e310b7382ca181c24c23f6f8d3b434261
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. cd hedera-backend"
echo "2. Edit .env.local and add your OPENAI_API_KEY"
echo "3. npm run dev"
echo "4. Test: curl http://localhost:3000/api/hedera-agent?action=status"
echo ""
echo "🚀 Your real Hedera AI Agent backend is ready!"
