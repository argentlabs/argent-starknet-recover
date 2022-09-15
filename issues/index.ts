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

export async function selectAccountIssuesToFix(
  issues: IssuesMap
): Promise<IssuesMap> {
  const allIssues = uniqBy(
    (Object.entries(issues) as [string, string[]][]).flatMap(([key, value]) =>
      value.map((x) => [key, x] as const)
    ),
    "1"
  );
  const { issuesToFix }: { issuesToFix: [keyof IssuesMap, string][] } =
    await prompts(
      {
        type: "multiselect",
        name: "issuesToFix",
        message: "Choose issues to fix",
        choices: allIssues.map(([issue, address]) => ({
          title: `${issue}: ${truncateAddress(address)}`,
          value: [issue, address],
          selected: true,
        })),
      },
      { onCancel: () => process.exit(1) }
    );

  return issuesToFix.reduce(
    (acc, [issue, address]) => ({
      ...acc,
      [issue]: [...(acc[issue] ?? []), address],
    }),
    {} as IssuesMap
  );
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
