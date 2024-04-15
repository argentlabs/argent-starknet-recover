import { shortString } from "starknet-410";
import { NetworkId } from "./types";
import { getRpcBatchProviderForNetworkId } from "./getProvider";

export async function getVersion(addresses: string[], networkId: NetworkId) {
  const multicall = getRpcBatchProviderForNetworkId(networkId);

  const versionAnswers = await Promise.allSettled(
    addresses.map(async (address) => {
      const getVersion = await multicall.callContract({
        contractAddress: address,
        entrypoint: "getVersion",
      });
      if (getVersion !== undefined) {
        return getVersion;
      }
      const get_version = await multicall.callContract({
        contractAddress: address,
        entrypoint: "get_version",
      });
      if (get_version !== undefined) {
        return get_version;
      }
      throw new Error("Unable to get version on chain");
    })
  );

  const versions = versionAnswers
    .map((answer) => {
      if (answer.status === "fulfilled" && answer.value !== undefined) {
        return answer.value;
      } else {
        return null;
      }
    })
    .flat();

  return versions.map((hex) =>
    hex ? shortString.decodeShortString(hex) : null
  );
}
