import { createPublicClient, http, createWalletClient } from "viem";
import { abi } from "../artifacts/contracts/TokenizedBallot.sol/TokenizedBallot.json";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
dotenv.config();
import { hexToString } from "viem";
import * as readlineSync from "readline-sync";

/// ENV CONSTANTS
const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const deployerPrivateKey = process.env.PRIVATE_KEY || "";

/// GET USER INPUT FUNCTION
function getUserInput(prompt: string): string {
  return readlineSync.question(prompt);
}

async function main() {
  /// CONNECT TO TESTNET CHAIN VIA PUBLICCLIENT
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });

  /// OBTAIN CONTRACT ADDRESS FROM USER INPUT
  const userInput = getUserInput("Please input the contract address: ");
  const contractAddress = userInput as `0x${string}`;
  if (!contractAddress) throw new Error("Contract address not provided");
  if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress))
    throw new Error("Invalid contract address");

  /// SEND SIMULATECONTRACT REQUEST TO QUERY BLOCKCHAIN FOR RESULTS
  const result = await publicClient.simulateContract({
    address: contractAddress,
    abi,
    functionName: "winnerName",
  });
  console.log("Winning proposal:", hexToString(result.result, { size: 32 }));
  process.exit();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
