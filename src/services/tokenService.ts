/**
 * ERC-20 Token Service
 * Handles USDC and other token balances on Polygon Amoy
 */

import { ethers, Contract, JsonRpcProvider } from 'ethers';
import { NETWORK_CONFIG } from '../config/network';

// Standard ERC-20 ABI (only what we need)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

export class TokenService {
  private provider: JsonRpcProvider;

  constructor() {
    this.provider = new JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
  }

  /**
   * Get USDC balance for an address
   */
  async getUSDCBalance(address: string): Promise<string> {
    try {
      const usdcContract = new Contract(
        NETWORK_CONFIG.tokens.usdc,
        ERC20_ABI,
        this.provider
      );

      const balance = await usdcContract.balanceOf(address);
      const decimals = await usdcContract.decimals();
      
      // Format balance (USDC has 6 decimals)
      const formattedBalance = ethers.formatUnits(balance, decimals);
      
      return formattedBalance;
    } catch (error) {
      console.error('Failed to get USDC balance:', error);
      return '0';
    }
  }

  /**
   * Get token balance for any ERC-20 token
   */
  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    try {
      const tokenContract = new Contract(
        tokenAddress,
        ERC20_ABI,
        this.provider
      );

      const balance = await tokenContract.balanceOf(walletAddress);
      const decimals = await tokenContract.decimals();
      
      const formattedBalance = ethers.formatUnits(balance, decimals);
      
      return formattedBalance;
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return '0';
    }
  }

  /**
   * Get native MATIC balance
   */
  async getNativeBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get native balance:', error);
      return '0';
    }
  }

  /**
   * Get both USDC and MATIC balances
   */
  async getAllBalances(address: string): Promise<{
    usdc: string;
    matic: string;
  }> {
    try {
      const [usdc, matic] = await Promise.all([
        this.getUSDCBalance(address),
        this.getNativeBalance(address),
      ]);

      return { usdc, matic };
    } catch (error) {
      console.error('Failed to get balances:', error);
      return { usdc: '0', matic: '0' };
    }
  }

  /**
   * Get token symbol
   */
  async getTokenSymbol(tokenAddress: string): Promise<string> {
    try {
      const tokenContract = new Contract(
        tokenAddress,
        ERC20_ABI,
        this.provider
      );

      return await tokenContract.symbol();
    } catch (error) {
      console.error('Failed to get token symbol:', error);
      return 'TOKEN';
    }
  }
}

// Export singleton
export const tokenService = new TokenService();
