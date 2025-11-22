import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function deploy() {
  console.log("🚀 Deploying AgentWallet...\n");

  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Deployer:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "usdc\n");

  const abi = JSON.parse(fs.readFileSync("build/contracts_AgentWallet_sol_AgentWallet.abi", "utf8"));
  const bytecode = "0x" + fs.readFileSync("build/contracts_AgentWallet_sol_AgentWallet.bin", "utf8");

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(wallet.address, ethers.parseEther("1"));

  console.log("Deploying...");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n✅ DEPLOYED:", address);
  console.log("🔗 https://testnet.bscscan.com/address/" + address);

  console.log("\n💰 Sending 0.01 usdc...");
  const tx = await wallet.sendTransaction({
    to: address,
    value: ethers.parseEther("0.01")
  });
  await tx.wait();
  console.log("✅ Sent! Tx:", tx.hash);
  console.log("🔗 https://testnet.bscscan.com/tx/" + tx.hash);

  console.log("\n✨ DONE! Update agentWalletService.ts:");
  console.log(`   return '${address}';`);
}

deploy().catch(console.error);
