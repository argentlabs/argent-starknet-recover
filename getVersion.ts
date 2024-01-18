import { Multicall } from "@argent/x-multicall";
import { shortString } from "starknet";
import { NetworkId } from "./types";
import { getProviderForNetworkId } from "./getProvider";

export async function getVersion(addresses: string[], networkId: NetworkId) {
  const provider = getProviderForNetworkId(networkId);
  const multicallContract = new Multicall(provider as any);

  const versionAnswers = await Promise.allSettled(
    addresses.map((address) =>
      multicallContract
        .call({
          contractAddress: address,
          entrypoint: "getVersion",
        })
        .catch(() =>
          multicallContract.call({
            contractAddress: address,
            entrypoint: "get_version",
          })
        )
    )
  );

  const versions = versionAnswers
    .map((answer) => {
      if (answer.status === "fulfilled") {
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
