import TOKENS from "./default-tokens.json";
import { encode, uint256 } from "starknet";
import { formatTokenBalance } from "./formatTokenBalance";
import { Multicall } from "@argent/x-multicall";
import { getProviderForNetworkId } from "./getProvider";
import { NetworkId } from "./types";

export async function getBalances(
  addresses: string[],
  networkId: NetworkId,
  tokenWhiteList: string[] = []
) {
  const tokens = TOKENS.filter((token) => token.network === networkId).filter(
    (token) => {
      if (tokenWhiteList.length) {
        return tokenWhiteList.includes(token.symbol);
      } else {
        return true;
      }
    }
  );
  const tokenAddresses = tokens.map((token) => token.address);
  const provider = getProviderForNetworkId(networkId);
  const multicallProvider = new Multicall(provider as any);

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
    const rawBalance = balance
      ? uint256
          .uint256ToBN({
            low: encode.addHexPrefix(balance[0]),
            high: encode.addHexPrefix(balance[1]),
          })
          .toString()
      : "0";
    return {
      address: addressToken.address,
      token: addressToken.token,
      rawBalance,
      balance: formatTokenBalance(
        rawBalance,
        tokens.find((x) => x.address === addressToken.token)!.decimals
      ),
    };
  });
}
