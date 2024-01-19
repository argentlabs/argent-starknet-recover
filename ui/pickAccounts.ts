import prompts from "prompts";
import { truncateAddress, truncateHex } from "../addressFormatting";
import { formatTokenBalanceShort } from "../tokenFormatting";
import { NetworkId } from "../types";

export interface BaseAccount {
  address: string;
  networkId: NetworkId;
  signer: string | null;
  version: string | null;
  privateKey?: string;
  derivationPath?: string;
  deployImplementation?: string;
}

export interface Account extends BaseAccount {
  balances: { [token: string]: string };
  implementation: string | null;
}

interface PickAccountsOptions {
  single?: boolean;
  accountsToRecoverMessage?: string;
}

export async function pickAccounts(
  accountsToPickFrom: Account[],
  networkId: NetworkId,
  {
    single = false,
    accountsToRecoverMessage = "Choose accounts you would like to scan for issues",
  }: PickAccountsOptions = {}
): Promise<Account[]> {
  if (!accountsToPickFrom || accountsToPickFrom.length === 0) {
    console.error("No accounts found");
    process.exit(1);
  }

  const { accountsToRecover } = await prompts(
    [
      {
        type:
          accountsToPickFrom.length > 0 && (single ? "select" : "multiselect"),
        name: "accountsToRecover",
        message: accountsToRecoverMessage,
        choices: accountsToPickFrom.map((account) => {
          const balances = Object.entries(
            formatTokenBalanceShort(account.balances, networkId)
          ).filter(([, balance]) => balance !== "0.0");
          return {
            title: `${truncateAddress(account.address)} (${
              account.signer && `Signer: ${truncateHex(account.signer)}, `
            }${
              account.implementation &&
              `Implementation: ${truncateAddress(account.implementation)}`
            }${balances.length ? ", " : ""}${balances
              .map(([token, balance]) => `${balance} ${token}`)
              .join(", ")})`,
            value: account.address,
            selected: true,
          };
        }),
      },
    ],
    { onCancel: () => process.exit(1) }
  );

  if (!accountsToRecover || accountsToRecover.length === 0) {
    console.error("No accounts selected");
    process.exit(1);
  }

  const filteredAccountWithSigner = accountsToPickFrom.filter((account) =>
    accountsToRecover.includes(account.address)
  );

  return filteredAccountWithSigner;
}
