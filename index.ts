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
import { askForExtraAccounts, extraAccount } from "./ui/extraAccount";
import { equalSigner, getDefaultSigners } from "./genSigners";

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

  let { accounts, network, privateKey, seed } = await getAccountsAndNetwork(
    spinner
  );

  spinner.succeed("Found " + accounts.length + " wallets");

  if (accounts.length === 0) {
    accounts = await extraAccount(network, privateKey);
  } else if (await askForExtraAccounts()) {
    accounts = unionWith(
      accounts,
      await extraAccount(network, privateKey),
      (a, b) => a.address === b.address
    );
  }

  const accountInfos = await getAccountInfos(
    accounts.map((x) => x.address),
    network,
    spinner
  );

  const accountWithSigner: Account[] = accounts.map((account, i) => ({
    ...account,
    ...accountInfos[i],
  }));

  // find missing signers
  if (seed && accountWithSigner.some((x) => !x.privateKey)) {
    spinner.start("Trying to find missing private keys");
    const defaultSigners = getDefaultSigners(seed);
    accountWithSigner
      .filter((x) => !x.privateKey)
      .forEach((x) => {
        const signer = defaultSigners.find((y) =>
          equalSigner(x.signer, y.signer)
        );
        if (signer) {
          x.privateKey = signer.privateKey;
        }
      });
    if (accountWithSigner.some((x) => !x.privateKey)) {
      spinner.warn(
        "Could not find all private keys. Continuing with missing private keys"
      );
    } else {
      spinner.succeed("Found all private keys");
    }
  }

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
