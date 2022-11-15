import { SequencerProvider } from "starknet";
import { Multicall } from "@argent/x-multicall";

export async function getSigners(
  addresses: string[],
  network: "mainnet-alpha" | "goerli-alpha"
) {
  const provider = new SequencerProvider({ network });
  const multicallProvider = new Multicall(provider);

  const signers = (
    await Promise.all(
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
    )
  ).flat();

  return signers;
}
