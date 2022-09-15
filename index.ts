#!/usr/bin/env npx ts-node
import { program } from "commander";
import ora from "ora";
import { Account, pickAccounts } from "./ui/pickAccounts";
import { getAccountInfos } from "./getAccountsInfo";
import { getAccountsAndNetwork } from "./ui/getAccounts";
import {
  detectAccountIssues,
  fixAccountIssues,
  selectAccountIssuesToFix,
} from "./issues";
import { display } from "./displayAccounts";
import { selectAction } from "./actions";
import { unionWith } from "lodash";
import { oraLog } from "./oraLog";
import { showTransferAll } from "./actions/transferAll/ui";

program
  .name("Argent X CLI")
  .description("CLI to recover Argent X accounts")
  .version("0.8.0");

program.parse();
/**
 * 1. Choose network
 * 2. Ask if user wants to recover by seed or by private key
 * 3. If seed, ask for seed. If private key, ask for private key.
 * 4. Let user pick account addresses to recover.
 * 5. Scan for balances after asking which assets to scan for.
 * 6. Scan for accounts with problems (available upgrade)
 * 7. Allow user to send all funds to a single new address.
 * 8. Show all transactions that get executed to the user.
 * 9. Wait for confirmation.
 */

(async () => {
  const spinner = ora();

  const { accounts, network, defaultPrivateKey } = await getAccountsAndNetwork(
    spinner
  );

  const accountInfos = await getAccountInfos(
    accounts.map((x) => x.address),
    network,
    spinner
  );
  spinner.succeed("Found " + accounts.length + " wallets");

  const accountWithSigner: Account[] = accounts.map((account, i) => ({
    ...account,
    ...accountInfos[i],
  }));

  const filteredAccountWithSigner = await pickAccounts(
    accountWithSigner,
    network
  );

  const allAccounts = unionWith(
    accountWithSigner,
    filteredAccountWithSigner,
    (a, b) => a.address === b.address
  );

  display(filteredAccountWithSigner);

  const issues = await detectAccountIssues(filteredAccountWithSigner);

  const issuesDetectedCount = Object.values(issues).reduce(
    (acc, curr) => acc + curr.length,
    0
  );

  const selectedAction = await selectAction(issuesDetectedCount);

  switch (selectedAction) {
    case "fixIssues": {
      if (issuesDetectedCount) {
        const fixIssues = await selectAccountIssuesToFix(issues);

        return await fixAccountIssues(allAccounts, network, fixIssues);
      }
    }
    case "transferAll": {
      return await showTransferAll(filteredAccountWithSigner);
    }
    default:
      process.exit(0);
  }
})().catch((e) => {
  console.error("An error occured", e);
  process.exit(1);
});
