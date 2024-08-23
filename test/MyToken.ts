import { expect } from "chai";
import { viem } from "hardhat"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { parseEther, keccak256, toHex } from 'viem'

const MINT_VALUE = 100n;

async function deployContractFixture() {
  const publicClient = await viem.getPublicClient();
  const [deployer, acc1, acc2] = await viem.getWalletClients();
  const myTokenContract = await viem.deployContract("MyToken");
  return {
    publicClient,
    deployer,
    acc1,
    acc2,
    myTokenContract
  }
}

async function waitForTransactionSuccess(publicClient: any, txHash: any) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  if (!receipt || receipt.status !== "success") {
    throw new Error(`Transaction failed. Hash: ${txHash}`);
  }

  return receipt;
}

describe("MyToken Tokenized Votes", async () => {
  describe("Tokenized Votes", async () => {
    it("uses a valid ERC20 as payment token", async () => {
      const { myTokenContract } = await loadFixture(deployContractFixture);
      // check basic ERC20 functions
      const [totalSupply, name, symbol, decimals] = await Promise.all([
        await myTokenContract.read.totalSupply(),
        await myTokenContract.read.name(),
        await myTokenContract.read.symbol(),
        await myTokenContract.read.decimals(),
      ]);
      expect(totalSupply).to.equal(parseEther("0"));
      expect(name).to.equal("MyToken");
      expect(symbol).to.equal("MTK");
      expect(decimals).to.equal(18);
    });
    it("mint fails if not called by owner", async () => {
      const { myTokenContract, acc1 } = await loadFixture(deployContractFixture);
      await expect(myTokenContract.write.mint([acc1.account.address, MINT_VALUE], { account: acc1.account }))
        .to.be.rejected;
    });
    it("mint MINT_VALUE tokens to an account", async () => {
      const { myTokenContract, publicClient, acc1 } = await loadFixture(deployContractFixture);
      const balanceBefore = await myTokenContract.read.balanceOf([acc1.account.address]);

      // mint tokens
      const mintTx = await myTokenContract.write.mint([acc1.account.address, MINT_VALUE]);
      await waitForTransactionSuccess(publicClient, mintTx);

      const balanceAfter = await myTokenContract.read.balanceOf([acc1.account.address]);
      expect(balanceAfter).to.equal(balanceBefore + MINT_VALUE);
    });

    it("Voting power is 0 without delegation", async () => {
      const { myTokenContract, acc1 } = await loadFixture(deployContractFixture);
      const votes = await myTokenContract.read.getVotes([acc1.account.address]);
      expect(votes).to.equal(0n);
    });

    // it.only("Voting without voting power should fail", async () => {
    //   const { myTokenContract, acc1, acc2 } = await loadFixture(deployContractFixture);
    //   const votingPower = await myTokenContract.read.getVotes([acc2.account.address]);
    //   console.log("votingPower", votingPower);
    //   await expect(myTokenContract.write.vote([0], 
    //     { account: acc2.account }
    //   )).to.be.rejected;
    // });

    it("Self delegation and check voting power", async () => {
      const { myTokenContract, publicClient, acc1 } = await loadFixture(deployContractFixture);
      // Mint some tokens
      const mintTx = await myTokenContract.write.mint([acc1.account.address, MINT_VALUE]);
      await waitForTransactionSuccess(publicClient, mintTx);

      // Checking vote power
      const votesBefore = await myTokenContract.read.getVotes([acc1.account.address]);
      expect(votesBefore).to.equal(0n);
      console.log("votesBefore", votesBefore);

      // Self delegation transaction
      const delegateTx = await myTokenContract.write.delegate([acc1.account.address], {
        account: acc1.account
      });
      await waitForTransactionSuccess(publicClient, delegateTx);

      // Checking vote power
      const votesAfter = await myTokenContract.read.getVotes([acc1.account.address]);
      console.log("votesAfter", votesAfter);
      expect(votesAfter).to.equal(MINT_VALUE);
    });

    it("Acc 1 transfers MINT_VALUE/2 tokens to Acc 2", async () => {
      const { myTokenContract, publicClient, acc1, acc2 } = await loadFixture(deployContractFixture);
      // Mint some tokens
      const mintTx = await myTokenContract.write.mint([acc1.account.address, MINT_VALUE]);
      await waitForTransactionSuccess(publicClient, mintTx);

      // Self delegation transaction
      const delegateTx = await myTokenContract.write.delegate([acc1.account.address], {
        account: acc1.account
      });
      await waitForTransactionSuccess(publicClient, delegateTx);

      // Transfer tokens
      const transferTx = await myTokenContract.write.transfer(
        [acc2.account.address, MINT_VALUE / 2n],
        {
          account: acc1.account
        }
      );
      await waitForTransactionSuccess(publicClient, transferTx);

      // Checking vote power
      // ? Acc 1 should have MINT_VALUE/2 voting power bc it changes after transfer
      const votes1AfterTransfer = await myTokenContract.read.getVotes([acc1.account.address]);
      expect(votes1AfterTransfer).to.equal(MINT_VALUE / 2n);
      // ! Acc 2 should have 0 voting power as it does not update
      const votes2AfterTransfer = await myTokenContract.read.getVotes([acc2.account.address]);
      expect(votes2AfterTransfer).to.equal(0n);
    });

    // TODO: Add test for past votes w getBlockNumber
  })
})
