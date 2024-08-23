import { expect } from "chai";
import { viem } from "hardhat"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { parseEther, keccak256, toHex } from 'viem'

// ! WORK AROUND: import the artifacts from the build folder
import { MyToken } from "../artifacts/contracts/MyERC20.sol/MyToken.json"
import { MyNFT } from "../artifacts/contracts/MyERC721.sol/MyNFT.json"
import { TokenSale } from "../artifacts/contracts/TokenSale.sol/TokenSale.json"
import { bigint } from "hardhat/internal/core/params/argumentTypes";

const TEST_RATIO = 100n;
const TEST_PRICE = 10n;
const TEST_PURCHASE_SIZE = parseEther("1");
const TEST_RETURN_TOKEN_SIZE = parseEther("0.5");
const MINTER_ROLE = keccak256(toHex("MINTER_ROLE"));

async function deployContractFixture() {
  const publicClient = await viem.getPublicClient();
  const [owner, user_1, user_2, user_3] = await viem.getWalletClients();
  const myTokenContract = await viem.deployContract<MyToken>("MyToken")
  const myNFTContract = await viem.deployContract<MyNFT>("MyNFT")

  if (!myTokenContract.address || !myNFTContract.address) {
    throw new Error("ERCs Contracts not deployed");
  }

  const tokenSaleContract = await viem.deployContract<TokenSale>(
    "TokenSale",
    [
      TEST_RATIO,
      TEST_PRICE,
      myTokenContract.address,
      myNFTContract.address
    ]);

  // Give minter role to the TokenSale contract
  await myTokenContract.write.grantRole(
    [
      MINTER_ROLE,
      tokenSaleContract.address
    ]);
  expect(await myTokenContract.read.hasRole([MINTER_ROLE, tokenSaleContract.address])).to.be.true;
  return {
    publicClient,
    // Contracts
    tokenSaleContract,
    myTokenContract,
    myNFTContract,
    // Wallets
    owner,
    user_1,
    user_2,
    user_3,
  }
}


async function attachSaleContract(user: any, contractAddress: any) {
  return await viem.getContractAt(
    "TokenSale",
    contractAddress,
    { client: { wallet: user } }
  );
}



async function attachTokenContract(user: any, contractAddress: any) {
  return await viem.getContractAt<MyToken>(
    "MyToken",
    contractAddress,
    { client: { wallet: user } }
  );
}

async function getBalance(user: any, publicClient: any) {
  return await publicClient.getBalance({
    address: user.account.address,
  });
}


describe("NFT Shop", async () => {
  describe("When the Shop contract is deployed", async () => {
    it("defines the ratio as provided in parameters", async () => {
      const { tokenSaleContract } = await loadFixture(deployContractFixture);
      const ratio = await tokenSaleContract.read.ratio();
      expect(ratio).to.equal(TEST_RATIO);
    })
    it("defines the price as provided in parameters", async () => {
      const { tokenSaleContract } = await loadFixture(deployContractFixture);
      const price = await tokenSaleContract.read.price();
      expect(price).to.equal(TEST_PRICE);
    });
    it("uses a valid ERC20 as payment token", async () => {
      const { tokenSaleContract } = await loadFixture(deployContractFixture);
      const paymentTokenAddress = await tokenSaleContract.read.paymentToken();
      expect(paymentTokenAddress).to.not.be.undefined;
      const paymentTokenContract = await viem.getContractAt<MyToken>(
        "MyToken",
        paymentTokenAddress as `0x${string}`
      );
      // check basic ERC20 functions
      const [totalSupply, name, symbol, decimals] = await Promise.all([
        await paymentTokenContract.read.totalSupply(),
        await paymentTokenContract.read.name(),
        await paymentTokenContract.read.symbol(),
        await paymentTokenContract.read.decimals(),
      ]);
      expect(totalSupply).to.equal(parseEther("10"));
      expect(name).to.equal("MyToken");
      expect(symbol).to.equal("MTK");
      expect(decimals).to.equal(18);
    });
    it("uses a valid ERC721 as NFT collection", async () => {
      const { tokenSaleContract } = await loadFixture(deployContractFixture);
      const nftContractAddress = await tokenSaleContract.read.nftContract();
      expect(nftContractAddress).to.not.be.undefined;
      const nftContractContract = await viem.getContractAt<MyToken>(
        "MyToken",
        nftContractAddress as `0x${string}`
      );
      // check basic ERC721 functions
      const [name, symbol] = await Promise.all([
        await nftContractContract.read.name(),
        await nftContractContract.read.symbol(),
      ]);
      expect(name).to.equal("MyNFT");
      expect(symbol).to.equal("NFT");
    });
  })
  describe("When a user buys an ERC20 from the Token contract", async () => {
    it("charges the correct amount of ETH", async () => {
      const { publicClient, tokenSaleContract, myTokenContract, user_1 } = await loadFixture(deployContractFixture);
      // balance before
      const ethBalanceBefore = await publicClient.getBalance({
        address: user_1.account.address
      });
      // change 1 eth to 100 tokens using other account
      const buyTxn = await tokenSaleContract.write.buyTokens(
        {
          value: TEST_PURCHASE_SIZE,  // msg.value
          account: user_1.account     // connect user to contract
        });

      const receipt = await publicClient.getTransactionReceipt({
        hash: buyTxn
      });

      if (!receipt || receipt.status !== "success") {
        throw new Error("Transaction failed");
      }
      // get the difference
      const ethBalanceAfter = await publicClient.getBalance({
        address: user_1.account.address
      });
      // calculate gas price
      const gasUsed = receipt.gasUsed;
      const gasPrice = receipt.effectiveGasPrice;
      const txCost = gasUsed * gasPrice;
      // check 1
      const diff = ethBalanceBefore - ethBalanceAfter - txCost;
      expect(diff).to.equal(TEST_PURCHASE_SIZE);
    })
    it("gives the correct amount of tokens", async () => {
      const { publicClient, tokenSaleContract, myTokenContract, user_1 } = await loadFixture(deployContractFixture);
      // balance before
      const tokenBalanceBefore = await myTokenContract.read.balanceOf([user_1.account.address]);
      // change 1 eth to 100 tokens using other account
      const buyTxn = await tokenSaleContract.write.buyTokens(
        {
          value: TEST_PURCHASE_SIZE,  // msg.value
          account: user_1.account     // connect user to contract
        });

      const receipt = await publicClient.getTransactionReceipt({
        hash: buyTxn
      });

      if (!receipt || receipt.status !== "success") {
        throw new Error("Transaction failed");
      }
      // get the difference
      const tokenBalanceAfter = await myTokenContract.read.balanceOf([user_1.account.address]);
      // check 100
      const diff = Number(tokenBalanceAfter) - Number(tokenBalanceBefore);
      expect(BigInt(diff)).to.equal(TEST_PURCHASE_SIZE * TEST_RATIO);
    });
  })

  describe("When a user burns an ERC20 at the Shop contract", async () => {
    it.only("gives the correct amount of ETH", async () => {
      const { publicClient, tokenSaleContract, myTokenContract, user_1 } = await loadFixture(deployContractFixture);

      // change 1 eth to 100 tokens using other account
      const buyTxn = await tokenSaleContract.write.buyTokens(
        {
          value: TEST_PURCHASE_SIZE,  // msg.value
          account: user_1.account     // connect user to contract
        });

      const buyTokensTxnReceipt = await publicClient.getTransactionReceipt({
        hash: buyTxn
      });

      if (!buyTokensTxnReceipt || buyTokensTxnReceipt.status !== "success") {
        throw new Error("Transaction failed");
      }

      const tokenBalanceBefore = await myTokenContract.read.balanceOf([user_1.account.address]);

      // give allowance to the token sale contract
      const approveTokensTxn = await myTokenContract.write.approve(
        [tokenSaleContract.address, TEST_RETURN_TOKEN_SIZE],
        {
          account: user_1.account
        }
      );

      const approveTokensTxnReceipt = await publicClient.getTransactionReceipt({ hash: approveTokensTxn });
      if (!approveTokensTxnReceipt || approveTokensTxnReceipt.status !== "success") {
        throw new Error("Transaction failed");
      }

      const ethBalanceBefore = await publicClient.getBalance({
        address: user_1.account.address
      });

      // burn tokens
      const burnTx = await tokenSaleContract.write.returnTokens(
        [TEST_RETURN_TOKEN_SIZE],
        {
          account: user_1.account     // connect user to contract
        }
      );

      const returnTokensTxnReceipt = await publicClient.getTransactionReceipt({
        hash: burnTx
      });

      if (!returnTokensTxnReceipt || returnTokensTxnReceipt.status !== "success") {
        throw new Error("Transaction failed");
      }

      // get the difference
      const ethBalanceAfter = await publicClient.getBalance({
        address: user_1.account.address
      });
      // calculate gas price
      const gasUsed = returnTokensTxnReceipt.gasUsed;
      const gasPrice = returnTokensTxnReceipt.effectiveGasPrice;
      const txCost = gasUsed * gasPrice;

      // check 1
      const diff = ethBalanceBefore - ethBalanceAfter - txCost;
      expect(diff).to.equal(TEST_PURCHASE_SIZE);
    })
    it("burns the correct amount of tokens", async () => {
      const { publicClient, tokenSaleContract, myTokenContract, user_1 } = await loadFixture(deployContractFixture);

      // change 1 eth to 100 tokens using other account
      const buyTxn = await tokenSaleContract.write.buyTokens(
        {
          value: TEST_PURCHASE_SIZE,  // msg.value
          account: user_1.account     // connect user to contract
        });

      const buyTokensTxnReceipt = await publicClient.getTransactionReceipt({
        hash: buyTxn
      });

      if (!buyTokensTxnReceipt || buyTokensTxnReceipt.status !== "success") {
        throw new Error("Transaction failed");
      }

      const tokenBalanceBefore = await myTokenContract.read.balanceOf([user_1.account.address]);

      // give allowance to the token sale contract
      const approveTokensTxn = await myTokenContract.write.approve(
        [tokenSaleContract.address, TEST_RETURN_TOKEN_SIZE],
        {
          account: user_1.account
        }
      );

      const approveTokensTxnReceipt = await publicClient.getTransactionReceipt({ hash: approveTokensTxn });
      if (!approveTokensTxnReceipt || approveTokensTxnReceipt.status !== "success") {
        throw new Error("Transaction failed");
      }

      // burn tokens
      const burnTx = await tokenSaleContract.write.returnTokens(
        [TEST_RETURN_TOKEN_SIZE],
        {
          account: user_1.account     // connect user to contract
        }
      );

      const returnTokensTxnReceipt = await publicClient.getTransactionReceipt({
        hash: burnTx
      });

      if (!returnTokensTxnReceipt || returnTokensTxnReceipt.status !== "success") {
        throw new Error("Transaction failed");
      }

      // get the difference
      const tokenBalanceAfter = await myTokenContract.read.balanceOf([user_1.account.address]);
      const diff = Number(tokenBalanceBefore) - Number(tokenBalanceAfter);
      expect(BigInt(diff)).to.equal(TEST_RETURN_TOKEN_SIZE);
    });
  })
  describe("When a user buys an NFT from the Shop contract", async () => {
    it("charges the correct amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    })
    it("gives the correct NFT", async () => {
      throw new Error("Not implemented");
    });
  })
  describe("When a user burns their NFT at the Shop contract", async () => {
    it("gives the correct amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    });
  })
  describe("When the owner withdraws from the Shop contract", async () => {
    it("recovers the right amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    })
    it("updates the owner pool account correctly", async () => {
      throw new Error("Not implemented");
    });
  });
});