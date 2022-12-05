import { uniqBy } from "lodash";
import prompts from "prompts";
import { truncateAddress } from "../addressFormatting";
import { Account } from "../ui/pickAccounts";
import { detect as detectOldHashAlgo } from "./oldHashAlgo/detect";
import { fix as fixOldHashAlgo } from "./oldHashAlgo/fix";

interface IssuesMap {
  oldHashAlgo?: string[];
}

export async function detectAccountIssues(
  accounts: Account[]
): Promise<IssuesMap> {
  const oldHashAlgo = await detectOldHashAlgo(accounts);
  return { oldHashAlgo };
}

export async function fixAccountIssues(
  accounts: Account[],
  network: "mainnet-alpha" | "goerli-alpha",
  issues: IssuesMap
): Promise<void> {
  const { oldHashAlgo } = issues;
  if (oldHashAlgo?.length && oldHashAlgo?.length > 0) {
    await fixOldHashAlgo(accounts, network, oldHashAlgo);
  }
}
