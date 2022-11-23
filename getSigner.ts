import { SequencerProvider } from "starknet";
import { Multicall } from "@argent/x-multicall";

export async function getSigners(
  addresses: string[],
  network: "mainnet-alpha" | "goerli-alpha"
) {
  const provider = new SequencerProvider({ network });
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
