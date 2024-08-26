import { privateKeyToAccount } from "viem/accounts";
import {
  createPublicClient,
  http,
  createWalletClient,
  formatEther,
} from "viem";
import {
  abi,
  bytecode,
} from "../artifacts/contracts/TokenizedBallot.sol/TokenizedBallot.json";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
dotenv.config();
import { toHex, hexToString } from "viem";
import * as readlineSync from "readline-sync";

/// CONSTANTS
const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const deployerPrivateKey = process.env.PRIVATE_KEY || "";
const myERC20TokenContract = `${0xb6fdded8a7e27917e324d30d4c965b9cdd5782db}`; // Figure out how to automatically pull this in

/// GET USER INPUT FUNCTION (FROM CLAUDE)
function getUserInputUntilQuit(queryString: string): string[] {
  const inputs: string[] = [];
  let continueLoop = true;

  while (continueLoop) {
    const userInput = readlineSync.question(
      queryString + ' (or "n" to quit): '
    );

    if (userInput.toLowerCase() === "n") {
      continueLoop = false;
      console.log("Exiting the input loop.");
    } else {
      inputs.push(userInput);
      console.log(`Input recorded: ${userInput}`);
    }
  }

  return inputs;
}
// Example usage:
// const userResponses = getUserInputUntilQuit('Enter a favorite color');
// console.log('All inputs:', userResponses);

/// MAIN FUNCTION
async function main() {
  /// CREATE PUBLICCLIENT TO CONNECT TO SEPOLIA TESTNET USING POKT GATEWAY
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  /// - PROVIDE PROOF OF SUCCESSFUL PUBLICCLIENT CREATION
  let blockNumber = await publicClient.getBlockNumber();
  console.log("Last block number:", blockNumber);

  /// SETUP WALLET CLIENT USING MY PRIVATE KEY
  const account = privateKeyToAccount(`0x${deployerPrivateKey}`);
  const deployer = createWalletClient({
    account,
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

  

  /// OBTAIN PROPOSALS FROM USER INPUT OR THROW ERROR
  const proposals = getUserInputUntilQuit(
    "Please enter all of the proposals you would like to vote on:"
  );
  if (!proposals || proposals.length < 1)
    throw new Error("Proposals not provided");
  /// - LOG PROPOSALS
  console.log("Proposals: ");
  proposals.forEach((element, index) => {
    console.log(`Proposal N. ${index + 1}: ${element}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
