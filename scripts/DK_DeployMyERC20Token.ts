import { privateKeyToAccount } from "viem/accounts";
import {
  createPublicClient,
  http,
  createWalletClient,
  parseEther,
  formatEther,
} from "viem";
import { abi, bytecode } from "../artifacts/contracts/MyToken.sol/MyToken.json";

import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
dotenv.config();

/// CONSTANTS
const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const deployerPrivateKey = process.env.PRIVATE_KEY || "";
const MINT_VALUE = parseEther('90');

/// MAIN FUNCTION
async function main() {
  /// CREATE PUBLICCLIENT TO CONNECT TO SEPOLIA USING POKT GATEWAY
  console.log("Connecting to blockchain with publicClient...");
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  /// - PROVIDE PROOF OF SUCCESSFUL PUBLICCLIENT CREATION
  const blockNumber = await publicClient.getBlockNumber();
  console.log("Last block number:", blockNumber, "\n");

  /// SETUP WALLET CLIENT USING MY PRIVATE KEY
  console.log("Setting up deployer wallet...");
  const deployerPvtKey = privateKeyToAccount(`0x${deployerPrivateKey}`);
  const deployer = createWalletClient({
    account: deployerPvtKey,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  /// - LOG DEPLOYER ACCOUNT ADDRESS ON TESTNET
  console.log("Deployer address:", deployer.account.address);
  /// - PROVIDE PROOF OF SUCCESSFUL WALLETCLIENT CREATION
  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });
  console.log(
    "Deployer balance: ",
    formatEther(balance),
    deployer.chain.nativeCurrency.symbol
  );

  /// DEPLOY MYERC20TOKEN CONTRACT TO TESTNET
  console.log("\nDeploying MyERC20Token contract...");
  const deployment = await deployer.deployContract({
    abi,
    bytecode: bytecode as `0x${string}`,
  });
  /// - LOG PROOF OF SUCCESSFUL CONTRACT DEPLOYMENT TRANSACTION
  console.log("Contract deployment transaction hash:", deployment);
  /// - REQUEST DEPLOYMENT TRANSACTION RECEIPT
  console.log("Waiting for confirmations...");
  const deploymentReceipt = await publicClient.waitForTransactionReceipt({
    hash: deployment,
  });
  const contractAddress = deploymentReceipt.contractAddress;
  /// - LOG CONTRACT ADDRESS FROM RECEIPT
  console.log("MyERC20 contract deployed to:", contractAddress, "\n");
  // - JUAN'S TYPE CHECK FOR CONTRACTADDRESS (TO AVOID TYPESCRIPT ERROR)
  if (!contractAddress) {
    console.log("Contract deployment failed");
    return;
  }

  /// MINT TOKENS FOR DEPLOYER
  console.log("Minting tokens for Deployer...");
  const deployerPubAddress = "0x0165363e7595133D3a538f5dFD85E0b5cf15CF93";
  const deployerMintTx = await deployer.writeContract({
    address: contractAddress,
    abi,
    functionName: "mint",
    args: [deployerPubAddress, MINT_VALUE],
  });
  console.log(`Transaction hash of Deployer Account token mint: ${deployerMintTx}`);
  console.log(
    `[Minted] ${MINT_VALUE.toString()} decimal units to account ${deployerPubAddress}`
  );
  console.log("Waiting for confirmations...");
  await publicClient.waitForTransactionReceipt({
    hash: deployerMintTx,
  });
  const deployerBalance = await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: "balanceOf",
    args: [deployerPubAddress]
  });
  console.log(
    `[Tokens] Account ${deployerPubAddress} has ${deployerBalance} decimal units of MyToken\n`
  );

  /// MINT TOKENS FOR ACCT 1
  console.log("Minting tokens for Account 1...");
  const acct1PubAddress = "0xA2A71645840E169111d1bbdE2dACC6E98A6C05B7";
  const acct1MintTx = await deployer.writeContract({
    address: contractAddress,
    abi,
    functionName: "mint",
    args: [acct1PubAddress, MINT_VALUE]
  });
  console.log(`Transaction hash of Account 1 token mint: ${acct1MintTx}`);
  console.log(
    `[Minted] ${MINT_VALUE.toString()} decimal units to account ${acct1PubAddress}`
  );
  console.log("Waiting for confirmations...");
  await publicClient.waitForTransactionReceipt({
    hash: acct1MintTx,
  });
  /// - GET ACCT 1 BALANCE
  const acct1Balance = await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: "balanceOf",
    args: [acct1PubAddress]
  });
  console.log(
    `[Tokens] Account ${acct1PubAddress} has ${acct1Balance} decimal units of MyToken\n`
  );

  /// MINT TOKENS FOR ACCT 2
  console.log("Minting tokens for Account 2...");
  const acct2PubAddress = "0x78E9e27509BA19CCA935962F9C9FBB80B175FC4B";
  const acct2MintTx = await deployer.writeContract({
    address: contractAddress,
    abi,
    functionName: "mint",
    args: [acct2PubAddress, MINT_VALUE]
  });
  console.log(`Transaction hash of Account 2 token mint: ${acct2MintTx}`);
  console.log(
    `[Minted] ${MINT_VALUE.toString()} decimal units to account ${acct2PubAddress}`
  );
  console.log("Waiting for confirmations...");
  await publicClient.waitForTransactionReceipt({
    hash: acct2MintTx,
  });
  /// - GET ACCT 2 BALANCE
  const acct2Balance = await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: "balanceOf",
    args: [acct2PubAddress]
  });
  console.log(
    `[Tokens] Account ${acct2PubAddress} has ${acct2Balance} decimal units of MyToken\n`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
