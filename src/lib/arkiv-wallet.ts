"use client";

import { createWalletClient, custom } from "@arkiv-network/sdk";
import { mendoza } from "@arkiv-network/sdk/chains";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export function createArkivWalletClient(provider?: EthereumProvider | unknown) {
  const ethereum = (provider ?? (typeof window !== "undefined" ? window.ethereum : undefined)) as EthereumProvider;
  if (!ethereum?.request) {
    throw new Error("No Ethereum provider found. Please connect your wallet.");
  }
  return createWalletClient({
    chain: mendoza,
    transport: custom(ethereum),
  });
}
