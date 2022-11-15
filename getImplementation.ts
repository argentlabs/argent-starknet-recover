import { Multicall } from "@argent/x-multicall";
import { SequencerProvider } from "starknet";

export async function getImplementation(
  addresses: string[],
  network: "mainnet-alpha" | "goerli-alpha"
) {
  const provider = new SequencerProvider({ network });
  const multicallProvider = new Multicall(provider);

  const implementations = (
    await Promise.all(
      addresses.map((address) =>
        multicallProvider.call({
          contractAddress: address,
          entrypoint: "get_implementation",
        })
      )
    )
  ).flat();

  return implementations;
}
