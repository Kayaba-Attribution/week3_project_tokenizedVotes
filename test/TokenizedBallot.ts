import { expect } from "chai";
import { viem } from "hardhat"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { parseEther, keccak256, toHex, hexToString, encodeAbiParameters, parseAbiParameters } from 'viem'

// Needed to use mine
// https://v1.viem.sh/docs/clients/test.html
import { createTestClient, http, publicActions, walletActions } from 'viem'
import { foundry, hardhat } from 'viem/chains'

const client = createTestClient({
    chain: hardhat,
    mode: 'hardhat',
    transport: http("http://127.0.0.1:8545/"),
})
    .extend(publicActions)
    .extend(walletActions)

const MINT_VALUE = 100n;
const MINTER_ROLE = keccak256(toHex("MINTER_ROLE"));
const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

async function deployContractFixture() {
    await client.setLoggingEnabled(true) // enable logging
    const isAutomining = await client.getAutomine()
    console.log(isAutomining)

    const publicClient = client;

    const myTokenContract = await viem.deployContract("MyToken");

    const [deployer, acc1, acc2] = await viem.getWalletClients();
    console.log(deployer.account.address)
    const targetBlockNumber = await client.getBlockNumber() + 100n;

    const ballotContract = await viem.deployContract("TokenizedBallot",
        [
            PROPOSALS.map((p) => toHex(p, { size: 32 })),
            myTokenContract.address,
            targetBlockNumber
        ],
    );

    return {
        publicClient,
        deployer,
        acc1,
        acc2,
        myTokenContract,
        ballotContract,
        targetBlockNumber
    }
}

async function waitForTransactionSuccess(publicClient: any, txHash: any) {
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (!receipt || receipt.status !== "success") {
        throw new Error(`Transaction failed. Hash: ${txHash}`);
    }

    return receipt;
}

describe("TokenizedBallot", async () => {
    describe("when the contract is deployed", async () => {
        // empty
        it("has the provided proposals", async () => {
            const { ballotContract } = await loadFixture(deployContractFixture);

            for (let index = 0; index < PROPOSALS.length; index++) {
                // read proposal, check by using loc 0 bytes32 name and converting hex to string
                const proposal = await ballotContract.read.proposals([BigInt(index)]);
                expect(hexToString(proposal[0], { size: 32 })).to.eq(PROPOSALS[index]);
            }
        });

        it("has zero votes for all proposals", async () => {
            const { ballotContract } = await loadFixture(deployContractFixture);
            for (let index = 0; index < PROPOSALS.length; index++) {
                // read proposal, check by using loc 1 uint voteCount and converting to BigInt
                const proposal = await ballotContract.read.proposals([BigInt(index)]);
                expect(proposal[1]).to.eq(BigInt(0));
            }
        });

        it("deploys with correct token contract and target block", async () => {
            const { ballotContract, myTokenContract, targetBlockNumber } = await loadFixture(deployContractFixture);

            const tokenContractAddress = await ballotContract.read.tokenContract();
            expect((tokenContractAddress.toLowerCase())).to.equal(myTokenContract.address);

            const storedTargetBlockNumber = await ballotContract.read.targetBlockNumber();
            expect(storedTargetBlockNumber).to.equal(targetBlockNumber);
        });

        it("check deployer has MINTER role", async () => {
            /**
            * @dev Returns `true` if `account` has been granted `role`.
            */
            // function hasRole(bytes32 role, address account) public view virtual returns (bool) {
            //     return _roles[role].hasRole[account];
            // }
            const { myTokenContract, deployer } = await loadFixture(deployContractFixture);
            const deployerMinter = await myTokenContract.read.hasRole([MINTER_ROLE, deployer.account.address]);
            expect(deployerMinter).to.equal(true);
        });
    });

    it("allows voting with sufficient voting power", async () => {
        const { ballotContract, myTokenContract, publicClient, acc1, targetBlockNumber } = await loadFixture(deployContractFixture);

        // Get acc1 voting power
        const votes = await myTokenContract.read.getVotes([acc1.account.address]);
        console.log(votes)

        // Mint tokens and self-delegate
        const mintTx = await myTokenContract.write.mint([acc1.account.address, MINT_VALUE]);
        await waitForTransactionSuccess(publicClient, mintTx);

        const delegateTx = await myTokenContract.write.delegate([acc1.account.address], { account: acc1.account });
        await waitForTransactionSuccess(publicClient, delegateTx);

        // Mine blocks
        await publicClient.mine({
            blocks: 100,
        })

        // Vote
        /**
         * ERC5805FutureLookup(101, 5)' Version: 2.19.4
         * 
         */
        const voteTx = await ballotContract.write.vote([0n, MINT_VALUE],
            { account: acc1.account }
        );
        await waitForTransactionSuccess(publicClient, voteTx);

        // Check vote count
        const proposal = await ballotContract.read.proposals([0n]);
        expect(proposal[1]).to.equal(MINT_VALUE);
    });

    it("prevents voting with insufficient voting power", async () => {
        const { ballotContract, myTokenContract, publicClient, acc1 } = await loadFixture(deployContractFixture);

        // Mint tokens but do not self-delegate
        const mintTx = await myTokenContract.write.mint([acc1.account.address, MINT_VALUE]);
        await waitForTransactionSuccess(publicClient, mintTx);

        // Mine blocks
        await publicClient.mine({
            blocks: 100,
        })

        // Attempt to vote
        await expect(ballotContract.write.vote([0, MINT_VALUE], { account: acc1.account }))
            .to.be.rejectedWith("TokenizedBallot: Insufficient voting power");
    });

    it("correctly calculates the winning proposal", async () => {
        const { ballotContract, myTokenContract, publicClient, acc1, acc2, targetBlockNumber } = await loadFixture(deployContractFixture);

        // Mint tokens and self-delegate
        const mintTx1 = await myTokenContract.write.mint([acc1.account.address, MINT_VALUE]);
        await waitForTransactionSuccess(publicClient, mintTx1);

        const mintTx2 = await myTokenContract.write.mint([acc2.account.address, MINT_VALUE]);
        await waitForTransactionSuccess(publicClient, mintTx2);

        const delegateTx1 = await myTokenContract.write.delegate([acc1.account.address], { account: acc1.account });
        await waitForTransactionSuccess(publicClient, delegateTx1);

        const delegateTx2 = await myTokenContract.write.delegate([acc2.account.address], { account: acc2.account });
        await waitForTransactionSuccess(publicClient, delegateTx2);

        // Mine blocks
        await publicClient.mine({
            blocks: 100,
        })

        // Vote
        const voteTx1 = await ballotContract.write.vote([0n, MINT_VALUE / 2n], { account: acc1.account });
        await waitForTransactionSuccess(publicClient, voteTx1);

        const voteTx2 = await ballotContract.write.vote([1n, MINT_VALUE], { account: acc2.account });
        await waitForTransactionSuccess(publicClient, voteTx2);

        // Mine blocks
        await publicClient.mine({
            blocks: 100,
        })

        // Check winner
        const winner = await ballotContract.read.winningProposal();
        expect(winner).to.equal(1n);
        const winnerName = hexToString((await ballotContract.read.proposals([winner]))[0], { size: 32 });
        expect(winnerName).to.equal(PROPOSALS[1]);
    });
});