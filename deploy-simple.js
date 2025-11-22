/**
 * Simple deployment script without Hardhat
 * Uses ethers.js directly
 */

const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

// Contract ABIs and bytecode
const FlexCreditCoreArtifact = require('./artifacts/contracts/FlexCreditCore.sol/FlexCreditCore.json');
const AgentPolicyArtifact = require('./artifacts/contracts/AgentPolicy.sol/AgentPolicy.json');
const IncomeProofVerifierArtifact = require('./artifacts/contracts/IncomeProofVerifier.sol/IncomeProofVerifier.json');
const AgentPerformanceVerifierArtifact = require('./artifacts/contracts/AgentPerformanceVerifier.sol/AgentPerformanceVerifier.json');

async function main() {
  console.log('🚀 Deploying FLEX + Vouch Contracts to Polygon Mainnet...\n');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider('https://polygon-bor-rpc.publicnode.com');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('Deploying with account:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('Account balance:', ethers.formatEther(balance), 'POL\n');

  // 1. Deploy FlexCreditCore
  console.log('📝 Deploying FlexCreditCore...');
  const FlexCreditCoreFactory = new ethers.ContractFactory(
    FlexCreditCoreArtifact.abi,
    FlexCreditCoreArtifact.bytecode,
    wallet
  );
  const creditCore = await FlexCreditCoreFactory.deploy();
  await creditCore.waitForDeployment();
  const creditCoreAddress = await creditCore.getAddress();
  console.log('✅ FlexCreditCore deployed to:', creditCoreAddress, '\n');

  // 2. Deploy AgentPolicy
  console.log('📝 Deploying AgentPolicy...');
  const AgentPolicyFactory = new ethers.ContractFactory(
    AgentPolicyArtifact.abi,
    AgentPolicyArtifact.bytecode,
    wallet
  );
  const agentPolicy = await AgentPolicyFactory.deploy(creditCoreAddress);
  await agentPolicy.waitForDeployment();
  const agentPolicyAddress = await agentPolicy.getAddress();
  console.log('✅ AgentPolicy deployed to:', agentPolicyAddress, '\n');

  // 3. Deploy IncomeProofVerifier
  console.log('📝 Deploying IncomeProofVerifier...');
  const IncomeProofVerifierFactory = new ethers.ContractFactory(
    IncomeProofVerifierArtifact.abi,
    IncomeProofVerifierArtifact.bytecode,
    wallet
  );
  const incomeVerifier = await IncomeProofVerifierFactory.deploy(creditCoreAddress);
  await incomeVerifier.waitForDeployment();
  const incomeVerifierAddress = await incomeVerifier.getAddress();
  console.log('✅ IncomeProofVerifier deployed to:', incomeVerifierAddress, '\n');

  // 4. Deploy AgentPerformanceVerifier
  console.log('📝 Deploying AgentPerformanceVerifier...');
  const AgentPerformanceVerifierFactory = new ethers.ContractFactory(
    AgentPerformanceVerifierArtifact.abi,
    AgentPerformanceVerifierArtifact.bytecode,
    wallet
  );
  const agentVerifier = await AgentPerformanceVerifierFactory.deploy(creditCoreAddress, agentPolicyAddress);
  await agentVerifier.waitForDeployment();
  const agentVerifierAddress = await agentVerifier.getAddress();
  console.log('✅ AgentPerformanceVerifier deployed to:', agentVerifierAddress, '\n');

  // 5. Authorize verifiers
  console.log('🔐 Authorizing verifiers...');
  const tx1 = await creditCore.authorizeVerifier(incomeVerifierAddress, true);
  await tx1.wait();
  console.log('✅ IncomeProofVerifier authorized');
  
  const tx2 = await creditCore.authorizeVerifier(agentVerifierAddress, true);
  await tx2.wait();
  console.log('✅ AgentPerformanceVerifier authorized\n');

  // 6. Authorize AgentPerformanceVerifier in AgentPolicy
  console.log('🔐 Authorizing AgentPerformanceVerifier in AgentPolicy...');
  const tx3 = await agentPolicy.authorizeExecutor(agentVerifierAddress, true);
  await tx3.wait();
  console.log('✅ AgentPerformanceVerifier authorized in AgentPolicy\n');

  // Print summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎉 DEPLOYMENT COMPLETE!');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('📋 Contract Addresses:');
  console.log('─────────────────────────────────────────────────────');
  console.log('FlexCreditCore:           ', creditCoreAddress);
  console.log('AgentPolicy:              ', agentPolicyAddress);
  console.log('IncomeProofVerifier:      ', incomeVerifierAddress);
  console.log('AgentPerformanceVerifier: ', agentVerifierAddress);
  console.log('─────────────────────────────────────────────────────\n');

  console.log('📝 Add these to your .env file:');
  console.log('─────────────────────────────────────────────────────');
  console.log(`NEXT_PUBLIC_FLEX_CREDIT_CORE=${creditCoreAddress}`);
  console.log(`NEXT_PUBLIC_AGENT_POLICY=${agentPolicyAddress}`);
  console.log(`NEXT_PUBLIC_INCOME_VERIFIER=${incomeVerifierAddress}`);
  console.log(`NEXT_PUBLIC_AGENT_VERIFIER=${agentVerifierAddress}`);
  console.log('─────────────────────────────────────────────────────\n');

  console.log('🔗 Verify on PolygonScan:');
  console.log(`https://polygonscan.com/address/${creditCoreAddress}`);
  console.log(`https://polygonscan.com/address/${agentPolicyAddress}`);
  console.log(`https://polygonscan.com/address/${incomeVerifierAddress}`);
  console.log(`https://polygonscan.com/address/${agentVerifierAddress}`);
  console.log('\n');

  // Save deployment info
  const deployment = {
    network: 'polygon',
    chainId: 137,
    timestamp: new Date().toISOString(),
    deployer: wallet.address,
    contracts: {
      FlexCreditCore: creditCoreAddress,
      AgentPolicy: agentPolicyAddress,
      IncomeProofVerifier: incomeVerifierAddress,
      AgentPerformanceVerifier: agentVerifierAddress,
    },
  };

  fs.writeFileSync(
    'deployment-polygon.json',
    JSON.stringify(deployment, null, 2)
  );
  console.log('💾 Deployment info saved to deployment-polygon.json\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
