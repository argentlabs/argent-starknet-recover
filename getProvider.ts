import { RpcProvider } from "starknet";
import { NetworkId } from "./types";

export const defaultRpcNodeUrls: Record<NetworkId, string[]> = {
  "mainnet-alpha": [
    "https://starknet-mainnet.public.blastapi.io",
    "https://rpc.starknet.lava.build",
  ],
  "goerli-alpha": [
    "https://starknet-testnet.public.blastapi.io",
    "https://rpc.starknet-testnet.lava.build",
  ],
};

export const getRandomDefaultRpcNodeUrlsForNetworkId = (
  networkId: NetworkId
) => {
  const nodeUrls = defaultRpcNodeUrls[networkId];
  const randomIndex = Math.floor(Math.random() * nodeUrls.length);
  return nodeUrls[randomIndex];
};

export const getRpcNodeUrlForNetworkId = (networkId: NetworkId) => {
  const fallbackNodeUrl = getRandomDefaultRpcNodeUrlsForNetworkId(networkId);
  if (networkId === "mainnet-alpha") {
    return process.env.MAINNET_RPC_URL ?? fallbackNodeUrl;
  }
  return process.env.TESTNET_RPC_URL ?? fallbackNodeUrl;
};

export const getProviderForNetworkId = (networkId: NetworkId) => {
  const nodeUrl = getRpcNodeUrlForNetworkId(networkId);
  return new RpcProvider({ nodeUrl });
};
