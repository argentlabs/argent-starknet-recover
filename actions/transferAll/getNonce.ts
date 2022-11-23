import { SequencerProvider as NewProvider } from "starknet-490";
import { SequencerProvider as OldProvider } from "starknet";

export async function getNonce(address: string, network: string) {
  const lowerCaseAddress = address.toLowerCase();
  try {
    const oldProvider = new OldProvider({ network: network as any });
    const nonceResponse = await oldProvider
      .callContract({
        contractAddress: lowerCaseAddress,
        entrypoint: "get_nonce",
      })
      .catch(() =>
        oldProvider.callContract({
          contractAddress: lowerCaseAddress,
          entrypoint: "getNonce",
        })
      );
    const nonce = nonceResponse.result[0];
    return nonce;
  } catch {
    const newProvider = new NewProvider({ network: network as any });
    return newProvider.getNonce(lowerCaseAddress);
  }
}
