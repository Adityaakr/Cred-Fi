/**
 * Simple Wallet Service - Works in Expo Go
 * 
 * This uses AsyncStorage instead of native biometrics.
 * Good for development/testing. For production, use native biometrics.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Wallet, JsonRpcProvider } from 'ethers';

const WALLET_KEY = 'simple_wallet_key';
const ADDRESS_KEY = 'simple_wallet_address';
const RPC_URL = 'https://polygon-amoy.drpc.org';

export class SimpleWalletService {
  private provider: JsonRpcProvider;

  constructor() {
    this.provider = new JsonRpcProvider(RPC_URL);
  }

  /**
   * Create a new wallet
   */
  async createWallet(username: string): Promise<string> {
    try {
      // Generate new wallet
      const wallet = Wallet.createRandom();
      
      // Store private key (encrypted in production!)
      await AsyncStorage.setItem(WALLET_KEY, wallet.privateKey);
      await AsyncStorage.setItem(ADDRESS_KEY, wallet.address);
      await AsyncStorage.setItem('wallet_username', username);

      return wallet.address;
    } catch (error) {
      console.error('Wallet creation failed:', error);
      throw new Error('Failed to create wallet');
    }
  }

  /**
   * Get stored wallet address
   */
  async getWalletAddress(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ADDRESS_KEY);
    } catch (error) {
      console.error('Failed to get wallet address:', error);
      return null;
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return balance.toString();
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  /**
   * Sign a transaction
   */
  async signTransaction(transaction: {
    to: string;
    value: string;
    data?: string;
    gasLimit?: string;
    gasPrice?: string;
  }): Promise<string> {
    try {
      // Get private key
      const privateKey = await AsyncStorage.getItem(WALLET_KEY);
      if (!privateKey) {
        throw new Error('No wallet found');
      }

      // Create wallet instance
      const wallet = new Wallet(privateKey, this.provider);

      // Prepare transaction
      const feeData = await this.provider.getFeeData();
      const tx = {
        to: transaction.to,
        value: transaction.value,
        data: transaction.data || '0x',
        gasLimit: transaction.gasLimit || 21000n,
        gasPrice: transaction.gasPrice || feeData.gasPrice,
      };

      // Sign transaction
      const signedTx = await wallet.signTransaction(tx);
      
      return signedTx;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw new Error('Failed to sign transaction');
    }
  }

  /**
   * Send a signed transaction
   */
  async sendTransaction(signedTx: string): Promise<string> {
    try {
      const tx = await this.provider.broadcastTransaction(signedTx);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Transaction send failed:', error);
      throw new Error('Failed to send transaction');
    }
  }

  /**
   * Sign a message
   */
  async signMessage(message: string): Promise<string> {
    try {
      // Get private key
      const privateKey = await AsyncStorage.getItem(WALLET_KEY);
      if (!privateKey) {
        throw new Error('No wallet found');
      }

      // Create wallet and sign message
      const wallet = new Wallet(privateKey);
      const signature = await wallet.signMessage(message);
      
      return signature;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw new Error('Failed to sign message');
    }
  }

  /**
   * Delete wallet
   */
  async deleteWallet(): Promise<void> {
    try {
      await AsyncStorage.removeItem(WALLET_KEY);
      await AsyncStorage.removeItem(ADDRESS_KEY);
      await AsyncStorage.removeItem('wallet_username');
    } catch (error) {
      console.error('Failed to delete wallet:', error);
      throw new Error('Failed to delete wallet');
    }
  }
}

// Export singleton instance
export const simpleWalletService = new SimpleWalletService();
