import { useState } from 'react';

/**
 * 🎣 useHederaAgent Hook
 * 
 * React hook to interact with the real Hedera AI Agent API
 * This calls your Next.js backend which uses the actual Hedera Agent Kit
 */

interface AgentResponse {
  success: boolean;
  data: any;
  error?: string;
}

interface UseHederaAgentReturn {
  loading: boolean;
  error: string | null;
  getBalance: () => Promise<AgentResponse>;
  analyzeOpportunity: (strategy: string, marketData: any) => Promise<AgentResponse>;
  executeCommand: (command: string) => Promise<AgentResponse>;
  getStatus: () => Promise<AgentResponse>;
  sendChatMessage: (message: string, sessionId?: string) => Promise<AgentResponse>;
  clearChat: (sessionId?: string) => Promise<AgentResponse>;
}

// Configure your API base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export function useHederaAgent(): UseHederaAgentReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get HBAR balance from Hedera network
   */
  const getBalance = async (): Promise<AgentResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/hedera-agent?action=balance`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get balance';
      setError(message);
      console.error('Get balance error:', err);
      return { success: false, data: null, error: message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Analyze a trading opportunity using AI
   */
  const analyzeOpportunity = async (
    strategy: string, 
    marketData: any
  ): Promise<AgentResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/hedera-agent?action=analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ strategy, marketData }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      console.error('Analyze opportunity error:', err);
      return { success: false, data: null, error: message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Execute a command through the AI agent
   * Examples:
   * - "What is my HBAR balance?"
   * - "Transfer 5 HBAR to account 0.0.1234"
   * - "Create a new token called 'MyToken' with symbol 'MTK'"
   */
  const executeCommand = async (command: string): Promise<AgentResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/hedera-agent?action=execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Execution failed';
      setError(message);
      console.error('Execute command error:', err);
      return { success: false, data: null, error: message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get agent status
   */
  const getStatus = async (): Promise<AgentResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hedera-agent?action=status`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      const message = 'Status check failed';
      console.error('Get status error:', err);
      return { success: false, data: null, error: message };
    }
  };

  /**
   * Send a chat message to the AI agent
   */
  const sendChatMessage = async (
    message: string,
    sessionId: string = 'default'
  ): Promise<AgentResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/hedera-agent?action=chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, sessionId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chat failed';
      setError(errorMessage);
      console.error('Send chat message error:', err);
      return { success: false, data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear chat history
   */
  const clearChat = async (sessionId: string = 'default'): Promise<AgentResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hedera-agent?action=clear`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = 'Failed to clear chat';
      console.error('Clear chat error:', err);
      return { success: false, data: null, error: errorMessage };
    }
  };

  return {
    loading,
    error,
    getBalance,
    analyzeOpportunity,
    executeCommand,
    getStatus,
    sendChatMessage,
    clearChat,
  };
}

/**
 * Example usage in a component:
 * 
 * ```typescript
 * const { loading, error, getBalance, executeCommand } = useHederaAgent();
 * 
 * // Get balance
 * const balance = await getBalance();
 * console.log(balance.data.output);
 * 
 * // Execute command
 * const result = await executeCommand("Transfer 5 HBAR to 0.0.1234");
 * console.log(result.data.output);
 * ```
 */
