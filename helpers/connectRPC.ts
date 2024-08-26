import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { providerApiKey } from "./constant";

export const connectRPC = async () => {
	const publicClient = createPublicClient({
		chain: sepolia,
		transport: http(`https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`),
	});

	return publicClient;
}