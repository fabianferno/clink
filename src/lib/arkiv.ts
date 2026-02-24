import { createPublicClient, http } from "@arkiv-network/sdk";
import { mendoza } from "@arkiv-network/sdk/chains";

export const ARKIV_RPC = "https://mendoza.hoodi.arkiv.network/rpc";

export const publicClient = createPublicClient({
  chain: mendoza,
  transport: http(ARKIV_RPC),
});

export const MENDOZA_CHAIN_ID = 60138453056;
