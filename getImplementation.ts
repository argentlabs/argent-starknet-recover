import { Multicall } from "@argent/x-multicall";
import { SequencerProvider } from "starknet";

export async function getImplementation(
  addresses: string[],
  network: "mainnet-alpha" | "goerli-alpha"
) {
  const provider = new SequencerProvider({ network });
  const multicallProvider = new Multicall(provider);

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
