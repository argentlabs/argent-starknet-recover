import { Multicall } from "@argent/x-multicall";
import { SequencerProvider, shortString } from "starknet";

export async function getVersion(
  addresses: string[],
  network: "mainnet-alpha" | "goerli-alpha"
) {
  const provider = new SequencerProvider({ network });
  const multicallContract = new Multicall(provider);

  const versions = (
    await Promise.all(
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
    )
  ).flat();

  return versions.map((hex) => shortString.decodeShortString(hex));
}
