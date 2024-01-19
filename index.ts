#!/usr/bin/env npx ts-node
import "@total-typescript/ts-reset";
import "./fetchPolyfill";

import { program } from "commander";
import ora from "ora";
import { Account, pickAccounts } from "./ui/pickAccounts";
import { getAccountInfos } from "./getAccountsInfo";
import { getAccountsAndNetwork } from "./ui/getAccounts";
import { display } from "./displayAccounts";
import { unionWith } from "lodash";
import { showTransferAll } from "./actions/transferAll/ui";
import { askForExtraAccounts, extraAccount } from "./ui/extraAccount";
import { equalSigner, getDefaultSigners } from "./genSigners";
import { detectAccountIssues, fixAccountIssues } from "./issues";
import { ec } from "starknet";

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

  let { accounts, networkId, privateKey, seed } = await getAccountsAndNetwork(
    spinner
  );

  spinner.succeed("Found " + accounts.length + " wallets");

  if (accounts.length === 0) {
    accounts = await extraAccount(networkId);
  } else if (await askForExtraAccounts()) {
    accounts = unionWith(
      accounts,
      await extraAccount(networkId),
      (a, b) => a.address === b.address
    );
  }

  const accountInfos = await getAccountInfos(
    accounts.map((x) => x.address),
    networkId,
    spinner
  );

  const accountWithSigner: Account[] = accounts.map((account, i) => ({
    ...account,
    ...accountInfos[i],
  }));

  // find missing signers
  if (accountWithSigner.some((x) => !x.privateKey)) {
    spinner.start("Trying to find missing private keys");
    if (seed) {
      const defaultSigners = getDefaultSigners(seed);
      accountWithSigner
        .filter((x) => !x.privateKey)
        .forEach((x) => {
          const signer = defaultSigners.find(
            (y) => x.signer && equalSigner(x.signer, y.signer)
          );
          if (signer) {
            x.privateKey = signer.privateKey;
          }
        });
    }
    if (privateKey) {
      const defaultSigner = ec.getStarkKey(ec.getKeyPair(privateKey));
      spinner.info(`Public key: ${defaultSigner}`);
      accountWithSigner
        .filter((x) => !x.privateKey)
        .forEach((x) => {
          if (x.signer && equalSigner(x.signer, defaultSigner)) {
            x.privateKey = privateKey;
          }
        });
    }
    if (accountWithSigner.some((x) => !x.privateKey)) {
      spinner.warn(
        "Could not find all private keys. Continuing with missing private keys"
      );
    } else {
      spinner.succeed("Found all signers");
    }
  }

  const filteredAccountWithSigner = await pickAccounts(
    accountWithSigner,
    networkId
  );

  display(filteredAccountWithSigner);

  const issues = await detectAccountIssues(filteredAccountWithSigner);

  await fixAccountIssues(accountWithSigner, networkId, issues);

  await showTransferAll(filteredAccountWithSigner);
})().catch((e) => {
  console.error("An error occured", e);
  process.exit(1);
});
