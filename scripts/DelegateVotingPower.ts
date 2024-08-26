import { viem } from "hardhat";
import { parseEther } from "viem";

const TOKEN_CONTRACT_ADDRESS = "";

async function main() {
  const publicClient = await viem.getPublicClient();
  const blockNumber = await publicClient.getBlockNumber();
  const MINT_AMOUNT = parseEther("100");
  const myTokenContract = await viem.getContractAt(
    "MyToken",
    TOKEN_CONTRACT_ADDRESS
  );

  const [account] = await viem.getWalletClients();

  console.log(account.account.address);

  const delegateTx = await myTokenContract.write.delegate([
    account.account.address,
  ]);
  const grantRoleTxReceipt = await publicClient.waitForTransactionReceipt({
    hash: delegateTx,
  });
  console.log(grantRoleTxReceipt);

  console.log("Delegated 100 voting power to", account.account.address);

  const getPastVotes = await myTokenContract.read.getPastVotes([
    account.account.address,
    blockNumber,
  ]);

  console.log("getPastVotes", getPastVotes);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});