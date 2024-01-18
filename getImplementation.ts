import { Multicall } from "@argent/x-multicall";
import { getProviderForNetworkId } from "./getProvider";
import { NetworkId } from "./types";

export async function getImplementation(
  addresses: string[],
  networkId: NetworkId
) {
  const provider = getProviderForNetworkId(networkId);
  const multicallProvider = new Multicall(provider as any);

  const implementationAnswers = await Promise.allSettled(
    addresses.map((address) =>
      multicallProvider.call({
        contractAddress: address,
        entrypoint: "get_implementation",
      })
    )
  );

  const implementations = implementationAnswers
    .map((answer) => {
      if (answer.status === "fulfilled") {
        return answer.value;
      } else {
        return null;
      }
    })
    .flat();

  return implementations;
}
