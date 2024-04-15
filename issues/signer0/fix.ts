import ora from "ora";
import { ec } from "starknet-410";
import { compileCalldata } from "starknet-410/dist/utils/stark";
import { execute } from "../../execute";
import { oraLog } from "../../oraLog";
import { Account, pickAccounts } from "../../ui/pickAccounts";
import { getProviderForNetworkId } from "../../getProvider";
import { NetworkId } from "../../types";

export const fix = async (
  accounts: Account[],
  networkId: NetworkId,
  accountsToRecover: string[]
): Promise<void> => {
  const [accountToCredit] = await pickAccounts(accounts, networkId, {
    single: true,
    accountsToRecoverMessage:
      "Select the account you want to use for the recovery",
  });
  if (!accountToCredit) {
    throw new Error("No account to credit");
  }
  const privateKey = accountToCredit.privateKey;
  if (!privateKey) {
    throw new Error("No private key for account to credit");
  }
  const spinner = ora(`Fixing 0signer issue (this may take some time)`).start();
  const provider = getProviderForNetworkId(networkId);
  const keyPair = ec.getKeyPair(privateKey);
  const starkKey = ec.getStarkKey(keyPair);

  for (const address of accountsToRecover) {
    const transaction = await execute(accountToCredit, {
      contractAddress: address,
      entrypoint: "initialize",
      calldata: compileCalldata({
        signer: starkKey,
        guardian: "0",
      }),
    });

    oraLog(spinner, `Transaction ${transaction.transaction_hash} created`);
    await provider.waitForTransaction(transaction.transaction_hash);

    const accountToUpdate = accounts.find((a) => a.address === address);
    if (accountToUpdate) {
      accountToUpdate.signer = starkKey;
      accountToUpdate.privateKey = privateKey;
    }

    // wait 1 minute extra to make sure the transaction is mined
    await new Promise((resolve) => setTimeout(resolve, 60000));
  }
  spinner.succeed(`Fixed 0signer issue`);
};
