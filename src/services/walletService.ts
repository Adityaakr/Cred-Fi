/**
 * Platform-Agnostic Wallet Service
 * Automatically uses:
 * - Web: MetaMask (window.ethereum)
 * - Mobile: Simple Wallet (AsyncStorage)
 */

import { Platform } from 'react-native';
import { webWalletService } from './webWalletService';
import { simpleWalletService } from './simpleWalletService';

const isWeb = Platform.OS === 'web';

/**
 * Unified wallet interface
 */
export const walletService = {
  /**
   * Connect wallet
   * Web: Connects MetaMask
   * Mobile: Creates simple wallet
   */
  async connect(username?: string): Promise<string> {
    if (isWeb) {
      return await webWalletService.connectMetaMask();
    } else {
      return await simpleWalletService.createWallet(username || 'user');
    }
  },

  /**
   * Get wallet address
   */
  async getAddress(): Promise<string | null> {
    if (isWeb) {
      return await webWalletService.getAddress();
    } else {
      return await simpleWalletService.getWalletAddress();
    }
  },

  /**
   * Get balance
   */
  async getBalance(address: string): Promise<string> {
    if (isWeb) {
      return await webWalletService.getBalance(address);
    } else {
      return await simpleWalletService.getBalance(address);
    }
  },

  /**
   * Send transaction
   */
  async sendTransaction(to: string, value: string): Promise<string> {
    if (isWeb) {
      return await webWalletService.sendTransaction(to, value);
    } else {
      const signedTx = await simpleWalletService.signTransaction({
        to,
        value,
      });
      return await simpleWalletService.sendTransaction(signedTx);
    }
  },

  /**
   * Sign message
   */
  async signMessage(message: string): Promise<string> {
    if (isWeb) {
      return await webWalletService.signMessage(message);
    } else {
      return await simpleWalletService.signMessage(message);
    }
  },

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    if (isWeb) {
      webWalletService.disconnect();
    } else {
      await simpleWalletService.deleteWallet();
    }
  },

  /**
   * Check if MetaMask is available (web only)
   */
  isMetaMaskAvailable(): boolean {
    return isWeb && webWalletService.isMetaMaskInstalled();
  },

  /**
   * Get platform
   */
  getPlatform(): string {
    return isWeb ? 'web' : 'mobile';
  },
};

/**
 * Network Configuration (now using Polygon Amoy)
 * @deprecated Use NETWORK_CONFIG from '../config/network' instead
 */
export const usdc_TESTNET_CONFIG = {
  chainId: 80002,
  name: 'Polygon Amoy Testnet',
  rpcUrl: 'https://polygon-amoy.drpc.org',
  blockExplorer: 'https://amoy.polygonscan.com',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
};

/**
 * Get transaction URL on block explorer
 */
export function getTransactionUrl(txHash: string): string {
  return `${usdc_TESTNET_CONFIG.blockExplorer}/tx/${txHash}`;
}

/**
 * Get address URL on block explorer
 */
export function getAddressUrl(address: string): string {
  return `${usdc_TESTNET_CONFIG.blockExplorer}/address/${address}`;
}
