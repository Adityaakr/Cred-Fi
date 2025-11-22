const { ethers } = require("ethers");
const fs = require("fs");
require("dotenv").config();

async function main() {
  console.log("🚀 Deploying AgentWallet contract to usdc Testnet...\n");

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Deploying with account:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Account balance:", ethers.formatEther(balance), "usdc\n");

  // Read contract
  const contractPath = "./artifacts/contracts/AgentWallet.sol/AgentWallet.json";
  const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));

  // Deploy parameters
  const ownerAddress = wallet.address;
  const spendingCap = ethers.parseEther("1"); // 1 usdc

  console.log("Deployment parameters:");
  console.log("- Owner:", ownerAddress);
  console.log("- Spending Cap:", ethers.formatEther(spendingCap), "usdc\n");

  // Deploy contract
  const factory = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, wallet);
  const contract = await factory.deploy(ownerAddress, spendingCap);
  
  console.log("Waiting for deployment...");
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("\n✅ AgentWallet deployed to:", contractAddress);
  console.log("🔗 View on usdcScan:", `https://testnet.bscscan.com/address/${contractAddress}\n`);

  // Send initial usdc
  console.log("💰 Sending 0.01 usdc to contract...");
  const tx = await wallet.sendTransaction({
    to: contractAddress,
    value: ethers.parseEther("0.01")
  });
  await tx.wait();
  console.log("✅ Sent 0.01 usdc to contract");
  console.log("Tx Hash:", tx.hash);
  console.log("🔗 View tx:", `https://testnet.bscscan.com/tx/${tx.hash}\n`);

  // Get contract stats
  const contractBalance = await provider.getBalance(contractAddress);
  console.log("📊 Contract balance:", ethers.formatEther(contractBalance), "usdc");

  console.log("\n✨ Deployment complete!");
  console.log("\n📝 Update your agentWalletService.ts with:");
  console.log(`   return '${contractAddress}';`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
