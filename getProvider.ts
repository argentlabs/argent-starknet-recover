import { RpcProvider as RpcProviderLatest } from "starknet";
import { RpcProvider as RpcProvider4220 } from "starknet-4220";
import { NetworkId } from "./types";
import { RpcBatchProvider } from "@argent/x-multicall";

export const argentCliHeaders = {
  "argent-version": process.env.VERSION || "Unknown version",
  "argent-client": "argent-cli",
};

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

export const getRpcNodeUrlsForNetworkId = (networkId: NetworkId) => {
  const fallbackNodeUrls = defaultRpcNodeUrls[networkId];
  if (networkId === "mainnet-alpha") {
    return process.env.MAINNET_RPC_URL
      ? [process.env.MAINNET_RPC_URL]
      : fallbackNodeUrls;
  }
  return process.env.TESTNET_RPC_URL
    ? [process.env.TESTNET_RPC_URL]
    : fallbackNodeUrls;
};

export const getRpcNodeUrlForNetworkId = (networkId: NetworkId) => {
  const nodeUrls = getRpcNodeUrlsForNetworkId(networkId);
  const randomIndex = Math.floor(Math.random() * nodeUrls.length);
  return nodeUrls[randomIndex];
};

export const getProvider4220ForNetworkId = (networkId: NetworkId) => {
  const nodeUrl = getRpcNodeUrlForNetworkId(networkId);
  return new RpcProvider4220({
    nodeUrl,
    headers: argentCliHeaders,
  });
};

export const getProviderForNetworkId = (networkId: NetworkId) => {
  const nodeUrl = getRpcNodeUrlForNetworkId(networkId);
  return new RpcProviderLatest({
    nodeUrl,
    headers: argentCliHeaders,
  });
};

export const getRpcBatchProviderForNetworkId = (networkId: NetworkId) => {
  const nodeUrl = getRpcNodeUrlForNetworkId(networkId);
  const multicall = new RpcBatchProvider({
    nodeUrl,
    batchInterval: 500,
    maxBatchSize: 10,
    headers: argentCliHeaders,
  });
  return multicall;
};
