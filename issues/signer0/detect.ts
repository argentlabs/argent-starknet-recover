import { BigNumber } from "ethers";
import { Account } from "../../ui/pickAccounts";

export const detect = async (accounts: Account[]): Promise<string[]> => {
  return accounts
    .filter(({ signer }) => BigNumber.from(signer).eq(0))
    .map(({ address }) => address);
};
