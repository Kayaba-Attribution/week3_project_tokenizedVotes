import { viem } from "hardhat";
import { parseEther } from "viem";

const tokenContractAddress = ""; // Add token contract address here

async function main() {
  const publicClient = await viem.getPublicClient();
  const blockNumber = await publicClient.getBlockNumber();
  const mintAmount = parseEther("100");
  const myTokenContract = await viem.getContractAt("MyToken", tokenContractAddress);
  const [account] = await viem.getWalletClients();

  console.log(account.account.address);

  const delegateTx = await myTokenContract.write.delegate([account.account.address,]);
  const grantRoleTxReceipt = await publicClient.waitForTransactionReceipt({hash: delegateTx,});
  
  console.log(grantRoleTxReceipt);
  console.log("Delegate voting power to", account.account.address);
}
