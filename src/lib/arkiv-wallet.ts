"use client";

import { createWalletClient, custom } from "@arkiv-network/sdk";
import { mendoza } from "@arkiv-network/sdk/chains";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

/**
 * Creates an Arkiv wallet client for signing transactions.
 * Requires either:
 * - A provider with an account (e.g. MetaMask with connected account), or
 * - A provider + account address (e.g. Privy's getEthereumProvider + wallet.address)
 *
 * The "Account required" error occurs when the provider doesn't expose a connected
 * account. Use Privy's useWallets + wallet.getEthereumProvider() for embedded wallets.
 */
export function createArkivWalletClient(
  provider: EthereumProvider | unknown,
  account?: `0x${string}`
) {
  const ethereum = provider as EthereumProvider;
  if (!ethereum?.request) {
    throw new Error("No Ethereum provider found. Please connect your wallet.");
  }
  return createWalletClient({
    chain: mendoza,
    transport: custom(ethereum),
    ...(account && { account }),
  });
}
