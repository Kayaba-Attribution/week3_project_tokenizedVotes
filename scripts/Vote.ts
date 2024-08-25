import { viem } from "hardhat";
import { createPublicClient, http, createWalletClient, formatEther } from "viem";
import type { PublicClient } from "viem/clients/createPublicClient";
import { toHex, hexToString } from "viem/utils";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
dotenv.config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const BALLOT_CONTRACT_ADDRESS = process.env.BALLOT_CONTRACT_ADDRESS || "";

async function main() {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
  });

  const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
  });

  const tokenizedBallotContract = await viem.getContractAt("TokenizedBallot", BALLOT_CONTRACT_ADDRESS);

  console.log("Voting on proposals...");

  const voteTx1 = await tokenizedBallotContract.write.vote(1n, 1n);
  await publicClient.waitForTransactionReceipt({ hash: voteTx1 });
  console.log(`Account ${account.address} voted 1 tokens for proposal 1`);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

//run script: npx hardhat run scripts/Vote.ts --network sepolia
