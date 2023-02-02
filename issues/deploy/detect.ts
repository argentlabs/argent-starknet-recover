import { Account } from "../../ui/pickAccounts";

export const detect = async (accounts: Account[]): Promise<string[]> => {
  return accounts
    .filter(
      ({ signer, implementation, version }) =>
        signer === null && implementation === null && version === null
    )
    .map(({ address }) => address);
};
