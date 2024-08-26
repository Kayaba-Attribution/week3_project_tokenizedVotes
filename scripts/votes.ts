import { privateKeyToAccount } from "viem/accounts";
import {
    createPublicClient,
    http,
    createWalletClient,
    formatEther,
} from "viem";
import { abi as myERC20TokenContractAbi } from "../artifacts/contracts/MyToken.sol/MyToken.json";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
dotenv.config();
import { toHex, hexToString } from "viem";
import * as readlineSync from "readline-sync";

/// CONSTANTS
const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const deployerPrivateKey = process.env.PRIVATE_KEY || "";

async function main() {

    const myERC20TokenContract = "0xba0314608ec9491040ec5cb56ba4c85ab994f797"

    /// CREATE PUBLICCLIENT TO CONNECT TO SEPOLIA TESTNET USING POKT GATEWAY
    console.log("\nConnecting to blockchain with publicClient...")
    const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
    });

    const deployerVotingRightsAfter = await publicClient.readContract({
        address: myERC20TokenContract as `0x${string}`,
        abi: myERC20TokenContractAbi,
        functionName: "getVotes",
        args: ["0x0165363e7595133D3a538f5dFD85E0b5cf15CF93"],
    });
    console.log(`Deployer has ${deployerVotingRightsAfter} of voting tokens`)
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});