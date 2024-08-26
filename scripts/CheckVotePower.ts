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
const myERC20TokenContract = "0xb6fdded8a7e27917e324d30d4c965b9cdd5782db"; // Figure out how to automatically pull this in

/// GET USER INPUT FUNCTION (FROM CLAUDE)
function getUserInput(prompt: string): string {
  return readlineSync.question(prompt);
}

/// MAIN FUNCTION
async function main() {
  /// OBTAIN PROPOSALS FROM USER INPUT OR THROW ERROR
  const acctToCheck = getUserInput(
    "Please enter the public address of the user whose voting power you'd like to check: "
  );

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

  /// GET BALANCE OF VOTING TOKENS
  const voteQuantity = await deployer.deployContract({
    abi,
    bytecode: bytecode as `0x${string}`,
    args: [
      proposals.map((prop) => toHex(prop, { size: 32 })),
      myERC20TokenContract,
      (blockNumber += 100n),
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

  /// PULL AND READ ALL PROPOSALS FROM OUR DEPLOYED CONTRACT
  console.log("Proposals:");
  for (let index = 0; index < proposals.length; index++) {
    const proposal = (await publicClient.readContract({
      address: receipt.contractAddress,
      abi,
      functionName: "proposals",
      args: [BigInt(index)],
    })) as any[];
    const name = hexToString(proposal[0], { size: 32 });
    console.log({ index, name, proposal });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
