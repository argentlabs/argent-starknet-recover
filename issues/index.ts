import { Account } from "../ui/pickAccounts";
import { detect as detectOldHashAlgo } from "./oldHashAlgo/detect";
import { fix as fixOldHashAlgo } from "./oldHashAlgo/fix";
import { detect as detectSigner0 } from "./signer0/detect";
import { detect as detectDeploy } from "./deploy/detect";
import { fix as fixSigner0 } from "./signer0/fix";
import { fix as fixDeploy } from "./deploy/fix";
import { NetworkId } from "../types";

interface IssuesMap {
  oldHashAlgo?: string[];
  signer0?: string[];
  deploy?: string[];
}

export async function detectAccountIssues(
  accounts: Account[]
): Promise<IssuesMap> {
  const oldHashAlgo = await detectOldHashAlgo(accounts);
  const signer0 = await detectSigner0(accounts);
  const deploy = await detectDeploy(accounts);
  return { oldHashAlgo, signer0, deploy };
}

export async function fixAccountIssues(
  accounts: Account[],
  networkId: NetworkId,
  issues: IssuesMap
): Promise<void> {
  const { oldHashAlgo, signer0, deploy } = issues;

  if (deploy?.length && deploy?.length > 0) {
    await fixDeploy(accounts, networkId, deploy);
  }
  if (oldHashAlgo?.length && oldHashAlgo?.length > 0) {
    await fixOldHashAlgo(accounts, networkId, oldHashAlgo);
  }
  if (signer0?.length && signer0?.length > 0) {
    await fixSigner0(accounts, networkId, signer0);
  }
}
