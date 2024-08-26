import { viem } from "hardhat";
import { createPublicClient, http, createWalletClient, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const deployerPrivateKey = process.env.PRIVATE_KEY || "";
const BALLOT_CONTRACT_ADDRESS = process.env.BALLOT_CONTRACT_ADDRESS || "";

async function main() {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`)
  });

  const account = privateKeyToAccount(`0x${deployerPrivateKey}`);
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`)
  });

  const tokenizedBallotContract = await viem.getContractAt("TokenizedBallot", "0xa303307108833e804c763ab3f4438486f7db78be");

  console.log("Voting on proposals...");

  // Vote on proposals
  const voteTx1 = await tokenizedBallotContract.write.vote([0n, parseEther("5")], {
    account: account.address,
  });
  await publicClient.waitForTransactionReceipt({ hash: voteTx1 });
  console.log(`Account ${account.address} voted 5 tokens for proposal 0`);

  // Check voting results
  for (let i = 0; i < 3; i++) {
    const proposal = await tokenizedBallotContract.read.proposals([BigInt(i)]);
    console.log(`Proposal ${i}: ${proposal[0]} has ${proposal[1]} votes`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

//OLD SCRIPT
// import { viem } from "hardhat";
// import { parseEther } from "viem";
// import dotenv from 'dotenv';
// dotenv.config();

// const BALLOT_CONTRACT_ADDRESS = process.env.BALLOT_CONTRACT_ADDRESS;

// async function main() {
//   const publicClient = await viem.getPublicClient();
//   const [deployer, acc1, acc2] = await viem.getWalletClients();

//   // Get the deployed TokenizedBallot contract
//   const tokenizedBallotContract = await viem.getContractAt("TokenizedBallot", BALLOT_CONTRACT_ADDRESS);

//   console.log("Voting on proposals...");

//   // Vote on proposals
//   const voteTx1 = await tokenizedBallotContract.write.vote([0, parseEther("5")], {
//     account: acc1.account,
//   });
//   await publicClient.waitForTransactionReceipt({ hash: voteTx1 });
//   console.log(`Account ${acc1.account.address} voted 5 tokens for proposal 0`);

//   const voteTx2 = await tokenizedBallotContract.write.vote([1, parseEther("3")], {
//     account: acc2.account,
//   });
//   await publicClient.waitForTransactionReceipt({ hash: voteTx2 });
//   console.log(`Account ${acc2.account.address} voted 3 tokens for proposal 1`);

//   // Check voting results
//   for (let i = 0; i < 3; i++) {
//     const proposal = await tokenizedBallotContract.read.proposals([BigInt(i)]);
//     console.log(`Proposal ${i}: ${proposal.name} has ${proposal.voteCount} votes`);
//   }
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
