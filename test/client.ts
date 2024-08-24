// Needed to use mine
// https://v1.viem.sh/docs/clients/test.html

import { createTestClient, http, publicActions, walletActions } from 'viem'
import { foundry, hardhat } from 'viem/chains'

const client = createTestClient({
    chain: foundry,
    mode: 'anvil',
    transport: http(),
})
    .extend(publicActions)
    .extend(walletActions)

export const testClient = client