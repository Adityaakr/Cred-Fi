import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { NexusSDK, type UserAsset, type OnIntentHookData, type OnAllowanceHookData } from '@avail-project/nexus-core';

interface NexusContextType {
  nexusSDK: NexusSDK | null;
  unifiedBalance: UserAsset[] | null;
  intent: React.RefObject<OnIntentHookData | null>;
  allowance: React.RefObject<OnAllowanceHookData | null>;
  loading: boolean;
  initialized: boolean;
  initializeNexus: (provider: any) => Promise<void>;
  fetchUnifiedBalance: () => Promise<void>;
}

const NexusContext = createContext<NexusContextType | undefined>(undefined);

interface NexusProviderProps {
  children: React.ReactNode;
}

export function NexusProvider({ children }: NexusProviderProps) {
  const [nexusSDK, setNexusSDK] = useState<NexusSDK | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [unifiedBalance, setUnifiedBalance] = useState<UserAsset[] | null>(null);
  
  const intent = useRef<OnIntentHookData | null>(null);
  const allowance = useRef<OnAllowanceHookData | null>(null);
  const sdkRef = useRef<NexusSDK | null>(null);

  const initializeNexus = useCallback(async (provider: any) => {
    if (initialized || loading) {
      console.log('Nexus already initialized or loading');
      return;
    }

    setLoading(true);
    try {
      // Create SDK lazily on first init
      if (!sdkRef.current) {
        console.log('Creating NexusSDK instance...');
        sdkRef.current = new NexusSDK({ network: 'mainnet', debug: true });
      }
      
      const sdk = sdkRef.current;
      
      if (sdk.isInitialized()) {
        console.log('SDK already initialized');
        setNexusSDK(sdk);
        setInitialized(true);
        return;
      }

      console.log('Initializing Nexus SDK with provider...');
      await sdk.initialize(provider);
      
      // Set up event hooks
      sdk.setOnIntentHook((data: OnIntentHookData) => {
        console.log('Intent hook triggered:', data);
        intent.current = data;
      });

      sdk.setOnAllowanceHook((data: OnAllowanceHookData) => {
        console.log('Allowance hook triggered:', data);
        allowance.current = data;
      });

      setNexusSDK(sdk);
      setInitialized(true);
      
      // Fetch initial balance
      console.log('Fetching unified balance...');
      const balances = await sdk.getUnifiedBalances(false); // false = only CA-applicable tokens
      setUnifiedBalance(balances);
      
      console.log('✅ Nexus SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Nexus:', error);
      setInitialized(false);
    } finally {
      setLoading(false);
    }
  }, [initialized, loading]);

  const fetchUnifiedBalance = useCallback(async () => {
    if (!nexusSDK || !initialized) {
      console.log('Cannot fetch balance: SDK not initialized');
      return;
    }
    
    try {
      console.log('Refreshing unified balance...');
      const balances = await nexusSDK.getUnifiedBalances(false);
      setUnifiedBalance(balances);
    } catch (error) {
      console.error('Failed to fetch unified balance:', error);
    }
  }, [nexusSDK, initialized]);

  const value = useMemo(() => ({
    nexusSDK,
    unifiedBalance,
    intent,
    allowance,
    loading,
    initialized,
    initializeNexus,
    fetchUnifiedBalance,
  }), [nexusSDK, unifiedBalance, loading, initialized, initializeNexus, fetchUnifiedBalance]);

  // Always render children, even if Nexus fails to initialize
  return (
    <NexusContext.Provider value={value}>
      {children}
    </NexusContext.Provider>
  );
}

export function useNexus() {
  const context = useContext(NexusContext);
  if (!context) {
    console.warn('useNexus used outside NexusProvider - returning safe defaults');
    // Return safe defaults instead of crashing
    return {
      nexusSDK: null,
      unifiedBalance: null,
      intent: { current: null } as React.RefObject<OnIntentHookData | null>,
      allowance: { current: null } as React.RefObject<OnAllowanceHookData | null>,
      loading: false,
      initialized: false,
      initializeNexus: async () => { console.warn('Nexus not initialized'); },
      fetchUnifiedBalance: async () => { console.warn('Nexus not initialized'); },
    };
  }
  return context;
}
