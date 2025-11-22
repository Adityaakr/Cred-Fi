// Network Configuration
export const NETWORK_CONFIG = {
  chainId: 137, // Polygon Mainnet
  chainName: 'Polygon Mainnet',
  rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
  blockExplorer: 'https://polygonscan.com',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  // Contract addresses (update these after deployment)
  contracts: {
    agentWallet: '0xF9c36b4fBA23F515b1ae844642F81DC0aDdf6AF6', // Update after deployment
    pool: '0xF9c36b4fBA23F515b1ae844642F81DC0aDdf6AF6', // Update after deployment
  },
  // Token addresses on Polygon Mainnet
  tokens: {
    usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC on Polygon Mainnet (native USDC)
    usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT on Polygon Mainnet
    dai: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // DAI on Polygon Mainnet
  },
};

// Display configuration
export const DISPLAY_CONFIG = {
  networkName: 'Polygon',
  networkBadge: 'Polygon Mainnet',
  nativeToken: 'POL',
  stablecoin: 'USDC',
};
