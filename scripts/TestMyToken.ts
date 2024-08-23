import { createPublicClient, http, createWalletClient, formatEther } from "viem";
import type { PublicClient } from "viem/clients/createPublicClient";
import { toHex, hexToString } from "viem/utils";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as dotenv from "dotenv";
import { viem } from "hardhat"
dotenv.config();

const providerApiKey = process.env.ALCHEMY_API_KEY || "";
const deployerPrivateKey = process.env.PRIVATE_KEY || "";
const MINT_VALUE = 100n;

function cropAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

async function main() {
    // npx ts-node --files ./scripts/TestMyToken.ts

    // Deploying contracts to HRE using Viem
    const publicClient = await viem.getPublicClient();
    const [deployer, acc1, acc2, acc3] = await viem.getWalletClients();
    const contract = await viem.deployContract("MyToken");
    console.log(`Token contract deployed at ${contract.address}\n`);

    // Minting some tokens
    const mintTx = await contract.write.mint([acc1.account.address, MINT_VALUE]);
    await publicClient.waitForTransactionReceipt({ hash: mintTx });
    console.log(
        `[Minted] ${MINT_VALUE.toString()} decimal units to account ${cropAddress(acc1.account.address)
        }\n`
    );
    const balanceBN = await contract.read.balanceOf([acc1.account.address]);
    console.log(
        `[Tokens] Account ${cropAddress(acc1.account.address)
        } has ${balanceBN.toString()} decimal units of MyToken\n`
    );

    // Checking vote power
    const votes = await contract.read.getVotes([acc1.account.address]);
    console.log(
        `[Votes] Account ${cropAddress(acc1.account.address)
        } has ${votes.toString()} units of voting power before self delegating\n`
    );

    // Self delegation transaction
    const delegateTx = await contract.write.delegate([acc1.account.address], {
        account: acc1.account,
    });
    await publicClient.waitForTransactionReceipt({ hash: delegateTx });
    const votesAfter = await contract.read.getVotes([acc1.account.address]);
    console.log(
        `[Votes] Account ${cropAddress(acc1.account.address)
        } has ${votesAfter.toString()} units of voting power after self delegating\n`
    );

    // Experimenting a token transfer 1/2
    const transferTx = await contract.write.transfer(
        [acc2.account.address, MINT_VALUE / 2n],
        {
            account: acc1.account,
        }
    );
    console.log(`[Tokens] Transfering ${MINT_VALUE / 2n} from ${cropAddress(acc1.account.address)} tokens to account ${cropAddress(acc2.account.address)}\n`);
    await publicClient.waitForTransactionReceipt({ hash: transferTx });
    const votes1AfterTransfer = await contract.read.getVotes([
        acc1.account.address,
    ]);
    console.log(
        `[Votes] Account ${cropAddress(acc1.account.address)
        } has ${votes1AfterTransfer.toString()} units of voting power after transferring\n`
    );
    const votes2AfterTransfer = await contract.read.getVotes([
        acc2.account.address,
    ]);
    console.log(
        `[Votes] Account ${cropAddress(acc2.account.address)
        } has ${votes2AfterTransfer.toString()} units of voting power after receiving a transfer\n`
    );

    // Experimenting a token transfer 2
    const transferTx2 = await contract.write.transfer(
        [acc3.account.address, MINT_VALUE / 4n],
        {
            account: acc2.account,
        }
    );
    console.log(`[Tokens] Transfering ${MINT_VALUE / 4n} from ${cropAddress(acc2.account.address)} tokens to account ${cropAddress(acc3.account.address)}\n`);

    await publicClient.waitForTransactionReceipt({ hash: transferTx2 });

    const votes2AfterTransfer2 = await contract.read.getVotes([
        acc2.account.address,
    ]);

    console.log(
        `[Votes] Account ${cropAddress(acc2.account.address)
        } has ${votes2AfterTransfer2.toString()} units of voting power after transferring\n`
    );

    const votes3AfterTransfer = await contract.read.getVotes([
        acc3.account.address,
    ]);

    console.log(
        `[Votes] Account ${cropAddress(acc3.account.address)
        } has ${votes3AfterTransfer.toString()} units of voting power after receiving a transfer\n`
    );

    const delegateTx2 = await contract.write.delegate([acc3.account.address], {
        account: acc3.account,
    });

    await publicClient.waitForTransactionReceipt({ hash: delegateTx2 });

    const votes3After = await contract.read.getVotes([acc3.account.address]);

    console.log(
        `[Votes] Account ${cropAddress(acc3.account.address)
        } has ${votes3After.toString()} units of voting power after self delegating\n`
    );

    // Checking past votes
    const lastBlockNumber = await publicClient.getBlockNumber();
    for (let index = lastBlockNumber - 1n; index > 0n; index--) {
        const pastVotes = await contract.read.getPastVotes([
            acc1.account.address,
            index,
        ]);
        console.log(
            `[Votes] Account ${cropAddress(acc1.account.address)
            } had ${pastVotes.toString()} units of voting power at block ${index}\n`
        );
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});