import TOKENS from "./default-tokens.json";
import { encode, SequencerProvider, uint256 } from "starknet";
import { formatTokenBalance } from "./formatTokenBalance";
import { Multicall } from "@argent/x-multicall";

export async function getBalances(
  addresses: string[],
  network: "mainnet-alpha" | "goerli-alpha"
) {
  const tokens = TOKENS.filter((token) => token.network === network);
  const tokenAddresses = tokens.map((token) => token.address);
  const provider = new SequencerProvider({ network });
  const multicallProvider = new Multicall(provider);

  const addressesTokensCombinations = tokenAddresses.flatMap((token) =>
    addresses.map((address) => ({ address, token }))
  );

  const results = await Promise.allSettled(
    addressesTokensCombinations.map(({ address, token }) =>
      multicallProvider.call({
        contractAddress: token,
        entrypoint: "balanceOf",
        calldata: [address],
      })
    )
  ).then((results) =>
    results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return null;
      }
    })
  );

  if (addressesTokensCombinations.length !== results.length) {
    throw new Error("Something went wrong");
  }

  return addressesTokensCombinations.map((addressToken, index) => {
    const balance = results[index];
    return {
      address: addressToken.address,
      token: addressToken.token,
      balance: formatTokenBalance(
        balance
          ? uint256
              .uint256ToBN({
                low: encode.addHexPrefix(balance[0]),
                high: encode.addHexPrefix(balance[1]),
              })
              .toString()
          : "0",
        tokens.find((x) => x.address === addressToken.token)!.decimals
      ),
    };
  });
}
