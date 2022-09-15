import { lt } from "semver";
import { Account } from "../../ui/pickAccounts";

export const detect = async (accounts: Account[]): Promise<string[]> => {
  return accounts
    .filter(({ version }) => lt(version, "0.2.1"))
    .map(({ address }) => address);
};
