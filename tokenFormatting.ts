import TOKENS from "./default-tokens.json";

export const formatTokenBalance = (
  balances: { [token: string]: string },
  network: "mainnet-alpha" | "goerli-alpha"
) => {
  const tokens = TOKENS.filter((x) => x.network === network);
  return Object.fromEntries(
    Object.entries(balances).map(([token, balance]) => {
      const tokenInfo = tokens.find((t) => t.address === token);
      return [tokenInfo?.name ?? token, balance] as const;
    })
  );
};

export const formatTokenBalanceShort = (
  balances: { [token: string]: string },
  network: "mainnet-alpha" | "goerli-alpha"
) => {
  const tokens = TOKENS.filter((x) => x.network === network);
  return Object.fromEntries(
    Object.entries(balances).map(([token, balance]) => {
      const tokenInfo = tokens.find((t) => t.address === token);
      return [tokenInfo?.symbol ?? token, balance] as const;
    })
  );
};
