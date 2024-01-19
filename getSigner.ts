import { Multicall } from "@argent/x-multicall";
import { getProviderForNetworkId } from "./getProvider";
import { NetworkId } from "./types";

export async function getSigners(addresses: string[], networkId: NetworkId) {
  const provider = getProviderForNetworkId(networkId);
  const multicallProvider = new Multicall(provider as any);

  const signerAnswers = await Promise.allSettled(
    addresses.map((address) =>
      multicallProvider
        .call({
          contractAddress: address,
          entrypoint: "getSigner",
        })
        .catch(() =>
          multicallProvider.call({
            contractAddress: address,
            entrypoint: "get_signer",
          })
        )
    )
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
