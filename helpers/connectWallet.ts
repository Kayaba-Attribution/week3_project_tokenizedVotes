import { createWalletClient, http, Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

import { providerApiKey, userPrivateKey } from "./constant";

export const connectWallet = async () => {
	const account = privateKeyToAccount(`0x${userPrivateKey}` as Address);
	const deployer = createWalletClient({
		account,
		chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
	});

	return deployer;
}