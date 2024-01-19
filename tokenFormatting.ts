import TOKENS from "./default-tokens.json";
import { NetworkId } from "./types";

export const formatTokenBalance = (
  balances: { [token: string]: string },
  networkId: NetworkId
) => {
  const tokens = TOKENS.filter((x) => x.network === networkId);
  return Object.fromEntries(
    Object.entries(balances).map(([token, balance]) => {
      const tokenInfo = tokens.find((t) => t.address === token);
      return [tokenInfo?.name ?? token, balance] as const;
    })
  );
};

export const formatTokenBalanceShort = (
  balances: { [token: string]: string },
  networkId: NetworkId
) => {
  const tokens = TOKENS.filter((x) => x.network === networkId);
  return Object.fromEntries(
    Object.entries(balances).map(([token, balance]) => {
      const tokenInfo = tokens.find((t) => t.address === token);
      return [tokenInfo?.symbol ?? token, balance] as const;
    })
  );
};
