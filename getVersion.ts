import { Multicall } from "@argent/x-multicall";
import { SequencerProvider, shortString } from "starknet";

export async function getVersion(
  addresses: string[],
  network: "mainnet-alpha" | "goerli-alpha"
) {
  const provider = new SequencerProvider({ network });
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
