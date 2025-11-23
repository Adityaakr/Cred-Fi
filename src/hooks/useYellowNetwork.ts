import { useEffect, useState } from 'react';
import { yellowNetworkService } from '../services/yellowNetworkService';

/**
 * Hook to initialize Yellow Network session when user logs in with Privy
 * 
 * Usage:
 * ```tsx
 * const { yellowConnected, yellowAddress } = useYellowNetwork(privyWallet, authenticated);
 * ```
 */
export function useYellowNetwork(privyWallet: any, authenticated: boolean) {
  const [yellowConnected, setYellowConnected] = useState(false);
  const [yellowAddress, setYellowAddress] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    // Only initialize if authenticated, have wallet, and not already connected
    if (authenticated && privyWallet && !yellowConnected && !initializing) {
      initializeYellow();
    }
  }, [authenticated, privyWallet, yellowConnected]);

  const initializeYellow = async () => {
    if (!privyWallet) return;

    setInitializing(true);
    try {
      console.log('🟡 Initializing Yellow Network with Privy wallet...');
      
      // Initialize Yellow Network with Privy wallet
      const address = await yellowNetworkService.init(privyWallet);
      
      console.log('✅ Yellow Network initialized:', address);
      setYellowAddress(address);
      setYellowConnected(true);

      // Yellow Network is now connected and ready to use
      // Credit sessions can be created later when needed (e.g., after verification)
      
    } catch (error) {
      console.error('❌ Failed to initialize Yellow Network:', error);
      setYellowConnected(false);
    } finally {
      setInitializing(false);
    }
  };

  return {
    yellowConnected,
    yellowAddress,
    initializing,
    isConnected: yellowNetworkService.isConnected(),
  };
}
