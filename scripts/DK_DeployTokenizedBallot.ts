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


// USAGE:
// npx ts-node --files ./scripts/DK_DeployTokenizedBallot.ts "Proposal1" "Proposal2" "Proposal3" tokenAddress

// Import the abi of the ERC20 token contract
import { abi as myERC20TokenContractAbi } from "../artifacts/contracts/MyToken.sol/MyToken.json";

import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
dotenv.config();
import { toHex, hexToString } from "viem";
import * as readlineSync from "readline-sync";

/// CONSTANTS
const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const deployerPrivateKey = process.env.PRIVATE_KEY || "";

// ? Use args directly to get the proposals and myERC20TokenContract
// const myERC20TokenContract = "0x5f14f394914e8d081fa4c5b86e58545c211fb06b"; // Figure out how to automatically pull this in

// /// GET USER INPUT FUNCTION
// function getUserInputUntilQuit(queryString: string): string[] {
//   const inputs: string[] = [];
//   let continueLoop = true;

//   while (continueLoop) {
//     const userInput = readlineSync.question(
//       queryString + ' (or "n" to quit): '
//     );

//     if (userInput.toLowerCase() === "n") {
//       continueLoop = false;
//       console.log("Exiting the input loop.");
//     } else {
//       inputs.push(userInput);
//       console.log(`Input recorded: ${userInput}`);
//     }
//   }

//   return inputs;
// }
// Example usage:
// const userResponses = getUserInputUntilQuit('Enter a favorite color');
// console.log('All inputs:', userResponses);

// ? helper function to wait for transaction success
async function waitForTransactionSuccess(publicClient: any, txHash: any) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  if (!receipt || receipt.status !== "success") {
      throw new Error(`Transaction failed. Hash: ${txHash}`);
  }

  return receipt;
}

/// MAIN FUNCTION
async function main() {
  /// OBTAIN PROPOSALS FROM USER INPUT OR THROW ERROR
  // const proposals = getUserInputUntilQuit(
  //   "Please enter all of the proposals you would like to vote on:"
  // );
  // if (!proposals || proposals.length < 1)
  //   throw new Error("Proposals not provided");
  /// - LOG PROPOSALS

  const args = process.argv.slice(2);
  if (args.length < 4) {
    throw new Error("Please provide 3 proposals and the ERC20 token contract address");
  }
  const proposals = args.slice(0, 3);
  const myERC20TokenContract = args[3];

  console.log("Proposals: ");
  proposals.forEach((element, index) => {
    console.log(`Proposal #${index + 1}: ${element}`);
  });
  console.log(`ERC20 Token Contract Address: ${myERC20TokenContract}`);

  /// CREATE PUBLICCLIENT TO CONNECT TO SEPOLIA TESTNET USING POKT GATEWAY
  console.log("\nConnecting to blockchain with publicClient...")
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
  });
  /// - PROVIDE PROOF OF SUCCESSFUL PUBLICCLIENT CREATION
  let blockNumber = await publicClient.getBlockNumber();
  console.log("Last block number:", blockNumber);
  /// - SET pastBlockNumber parameter
  const targetBlockNumber = blockNumber + 10n;

  /// SETUP WALLET CLIENT USING MY PRIVATE KEY
  console.log("\nSetting up deployer wallet...")
  const deployerAcct = privateKeyToAccount(`0x${deployerPrivateKey}`);
  const deployer = createWalletClient({
    account: deployerAcct,
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

  /// DEPLOY TOKENIZEDBALLOT CONTRACT TO TESTNET
  console.log("\nDeploying TokenizedBallot contract...");
  const hash = await deployer.deployContract({
    abi,
    bytecode: bytecode as `0x${string}`,
    args: [
      proposals.map((prop) => toHex(prop, { size: 32 })),
      myERC20TokenContract,
      targetBlockNumber
    ],
  });
  /// - LOG PROOF OF SUCCESSFUL DEPLOYMENT TRANSACTION
  console.log("Transaction hash:", hash);
  /// - REQUEST DEPLOYMENT TRANSACTION RECEIPT
  console.log("Waiting for confirmations...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  /// - LOG CONTRACT ADDRESS FROM RECEIPT
  console.log("Ballot contract deployed to:", receipt.contractAddress);
  // - JUAN'S TYPE CHECK FOR CONTRACTADDRESS (TO AVOID TYPESCRIPT ERROR)
  if (!receipt.contractAddress) {
    console.log("Contract deployment failed");
    return;
  }

  console.log("Proposals:");
  for (let index = 0; index < proposals.length; index++) {
    const proposal = (await publicClient.readContract({
      address: receipt.contractAddress as `0x${string}`,
      abi,
      functionName: "proposals",
      args: [BigInt(index)]
    })) as any[];
    const name = hexToString(proposal[0], { size: 32 });
    console.log({ index, name, proposal });
  }

  /// CHECK VOTING RIGHTS OF DEPLOYER
  console.log("\nChecking Deployer's voting rights...");
  const deployerVotingRights = await publicClient.readContract({
    address: myERC20TokenContract as `0x${string}`,
    abi: myERC20TokenContractAbi,
    functionName: "getVotes",
    args: [deployer.account.address]
  });
  console.log(`Deployer has ${deployerVotingRights} of voting tokens`)

  /// DEPLOYER SELF-DELEGATES VOTING RIGHTS
  const deployerDelegateVotingRights = await deployer.writeContract({
    address: myERC20TokenContract as `0x${string}`,
    abi: myERC20TokenContractAbi,
    functionName: "delegate",
    account: deployerAcct,
    args: [deployer.account.address], 
  });
  console.log(`Deployer has delegated himself voting tokens`)

  await waitForTransactionSuccess(publicClient, deployerDelegateVotingRights);


  // ? the abi you are using is the abi of the TokenizedBallot contract, not the ERC20 contract
  // ? thus the error 'Function "getVotes" not found on ABI'.
  // CHECK VOTING RIGHTS OF DEPLOYER
  const deployerVotingRightsAfter = await publicClient.readContract({
    address: myERC20TokenContract as `0x${string}`,
    abi: myERC20TokenContractAbi,
    functionName: "getVotes",
    args: [deployer.account.address],
  });
  console.log(`Deployer has ${deployerVotingRightsAfter} of voting tokens`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
