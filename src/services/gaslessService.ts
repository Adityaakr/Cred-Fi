/**
 * Gasless Transaction Service with ZeroDev Paymaster
 * Handles USDC transactions with gas sponsorship on Polygon Amoy
 */

import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '../config/network';

// ZeroDev Configuration for Polygon Mainnet
const ZERODEV_PROJECT_ID = '580b50bd-1e38-4e35-a270-b8c8faf80e53';
const ZERODEV_PAYMASTER_RPC = 'https://rpc.zerodev.app/api/v3/580b50bd-1e38-4e35-a270-b8c8faf80e53/chain/137?selfFunded=true';
const ZERODEV_BUNDLER_RPC = `https://rpc.zerodev.app/api/v2/bundler/${ZERODEV_PROJECT_ID}`;

// ERC-20 ABI for USDC transfers
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
];

export class GaslessService {
  /**
   * Send USDC with gas paid in USDC (gasless for user)
   * Uses Privy's sendTransaction with paymaster
   */
  async sendUSDCGasless(
    sendTransaction: any,
    walletAddress: string,
    toAddress: string,
    amount: string
  ) {
    try {
      console.log('💳 Sending USDC gasless:', { amount, to: toAddress });

      // Convert USDC amount (6 decimals)
      const amountInUSDC = ethers.parseUnits(amount, 6);

      // Create USDC transfer transaction
      const usdcInterface = new ethers.Interface(ERC20_ABI);
      const data = usdcInterface.encodeFunctionData('transfer', [
        toAddress,
        amountInUSDC,
      ]);

      // Transaction request
      const txRequest = {
        to: NETWORK_CONFIG.tokens.usdc,
        data: data,
        chainId: NETWORK_CONFIG.chainId,
        // No value needed for ERC-20 transfer
        value: '0',
      };

      // Send with Privy (will use paymaster if configured)
      const result = await sendTransaction(txRequest, {
        address: walletAddress,
      });

      console.log('✅ Gasless USDC sent:', result);
      return result;
    } catch (error) {
      console.error('❌ Gasless send failed:', error);
      throw error;
    }
  }

  /**
   * Estimate gas cost in USDC
   */
  async estimateGasCostInUSDC(txRequest: any): Promise<string> {
    try {
      const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);

      // Estimate gas
      const gasEstimate = await provider.estimateGas(txRequest);

      // Get gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('30', 'gwei');

      // Calculate total gas cost in wei
      const gasCostWei = gasEstimate * gasPrice;

      // Convert to MATIC
      const gasCostMatic = ethers.formatEther(gasCostWei);

      // Assume 1 MATIC = $0.80 and 1 USDC = $1
      // This should be fetched from a price oracle in production
      const maticPriceUSD = 0.8;
      const gasCostUSDC = (parseFloat(gasCostMatic) * maticPriceUSD).toFixed(6);

      return gasCostUSDC;
    } catch (error) {
      console.error('Failed to estimate gas cost:', error);
      return '0.01'; // Default estimate
    }
  }

  /**
   * Check if user has enough USDC to cover gas
   */
  async canPayGasWithUSDC(
    walletAddress: string,
    txAmount: string
  ): Promise<boolean> {
    try {
      const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
      const usdcContract = new ethers.Contract(
        NETWORK_CONFIG.tokens.usdc,
        ERC20_ABI,
        provider
      );

      const balance = await usdcContract.balanceOf(walletAddress);
      const balanceUSDC = ethers.formatUnits(balance, 6);

      // Estimate gas cost
      const gasCost = await this.estimateGasCostInUSDC({
        to: NETWORK_CONFIG.tokens.usdc,
        from: walletAddress,
      });

      const totalNeeded = parseFloat(txAmount) + parseFloat(gasCost);

      return parseFloat(balanceUSDC) >= totalNeeded;
    } catch (error) {
      console.error('Failed to check gas payment:', error);
      return false;
    }
  }
}

export const gaslessService = new GaslessService();
