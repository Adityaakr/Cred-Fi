const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying AgentWallet contract to usdc Testnet...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString(), "wei\n");

  // Contract parameters
  const ownerAddress = deployer.address; // You can change this to user's wallet
  const spendingCap = hre.ethers.utils.parseEther("1"); // 1 usdc spending cap

  console.log("Deployment parameters:");
  console.log("- Owner:", ownerAddress);
  console.log("- Spending Cap:", hre.ethers.utils.formatEther(spendingCap), "usdc\n");

  // Deploy contract
  const AgentWallet = await hre.ethers.getContractFactory("AgentWallet");
  const agentWallet = await AgentWallet.deploy(ownerAddress, spendingCap);

  await agentWallet.deployed();

  console.log("✅ AgentWallet deployed to:", agentWallet.address);
  console.log("🔗 View on usdcScan:", `https://testnet.bscscan.com/address/${agentWallet.address}\n`);

  // Send initial usdc to contract
  console.log("💰 Sending 0.01 usdc to contract...");
  const tx = await deployer.sendTransaction({
    to: agentWallet.address,
    value: hre.ethers.utils.parseEther("0.01")
  });
  await tx.wait();
  console.log("✅ Sent 0.01 usdc to contract");
  console.log("Tx Hash:", tx.hash);
  console.log("🔗 View tx:", `https://testnet.bscscan.com/tx/${tx.hash}\n`);

  // Get contract balance
  const balance = await agentWallet.getBalance();
  console.log("📊 Contract balance:", hre.ethers.utils.formatEther(balance), "usdc");

  // Get contract stats
  const stats = await agentWallet.getStats();
  console.log("\n📈 Agent Stats:");
  console.log("- Balance:", hre.ethers.utils.formatEther(stats.balance), "usdc");
  console.log("- Credit Allocated:", stats._creditAllocated.toString());
  console.log("- Credit Used:", stats._creditUsed.toString());
  console.log("- Spending Cap:", hre.ethers.utils.formatEther(stats._spendingCap), "usdc");
  console.log("- Reputation:", stats._reputation.toString(), "/100");
  console.log("- Nonce:", stats._nonce.toString());

  console.log("\n✨ Deployment complete!");
  console.log("\n📝 Update your agentWalletService.ts with:");
  console.log(`   return '${agentWallet.address}';`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
