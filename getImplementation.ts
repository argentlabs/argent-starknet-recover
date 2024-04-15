import {
  getProviderForNetworkId,
  getRpcBatchProviderForNetworkId,
} from "./getProvider";
import { NetworkId } from "./types";

export async function getImplementation(
  addresses: string[],
  networkId: NetworkId
) {
  const multicall = getRpcBatchProviderForNetworkId(networkId);

  const implementationAnswers = await Promise.allSettled(
    addresses.map(async (address) => {
      const get_implementation = await multicall.callContract({
        contractAddress: address,
        entrypoint: "get_implementation",
      });
      if (get_implementation !== undefined) {
        return get_implementation;
      }
      try {
        const provider = getProviderForNetworkId(networkId);
        const classHash = await provider.getClassHashAt(address);
        return classHash;
      } catch (e) {
        console.warn("Assuming tx V1 implementation");
        const TXV1_ACCOUNT_CLASS_HASH =
          "0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003";
        return TXV1_ACCOUNT_CLASS_HASH;
      }
    })
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
