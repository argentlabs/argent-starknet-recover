import { getRpcBatchProviderForNetworkId } from "./getProvider";
import { NetworkId } from "./types";

export async function getSigners(addresses: string[], networkId: NetworkId) {
  const multicall = getRpcBatchProviderForNetworkId(networkId);

  const signerAnswers = await Promise.allSettled(
    addresses.map(async (address) => {
      const getSigner = await multicall.callContract({
        contractAddress: address,
        entrypoint: "getSigner",
      });
      if (getSigner !== undefined) {
        return getSigner;
      }
      const get_signer = await multicall.callContract({
        contractAddress: address,
        entrypoint: "get_signer",
      });
      if (get_signer !== undefined) {
        return get_signer;
      }
      const get_owner = await multicall.callContract({
        contractAddress: address,
        entrypoint: "get_owner",
      });
      if (get_owner !== undefined) {
        return get_owner;
      }
      throw new Error("Unable to get signer on chain");
    })
  );

  const signers = signerAnswers
    .map((answer) => {
      if (answer.status === "fulfilled") {
        return answer.value;
      } else {
        return null;
      }
    })
    .flat();

  return signers;
}
