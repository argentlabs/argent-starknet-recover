import { Account } from "../ui/pickAccounts";
import { detect as detectOldHashAlgo } from "./oldHashAlgo/detect";
import { fix as fixOldHashAlgo } from "./oldHashAlgo/fix";
import { detect as detectSigner0 } from "./signer0/detect";
import { fix as fixSigner0 } from "./signer0/fix";

interface IssuesMap {
  oldHashAlgo?: string[];
  signer0?: string[];
}

export async function detectAccountIssues(
  accounts: Account[]
): Promise<IssuesMap> {
  const oldHashAlgo = await detectOldHashAlgo(accounts);
  const signer0 = await detectSigner0(accounts);
  return { oldHashAlgo, signer0 };
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
  if (issues.signer0?.length && issues.signer0?.length > 0) {
    await fixSigner0(accounts, network, issues.signer0);
  }
}
