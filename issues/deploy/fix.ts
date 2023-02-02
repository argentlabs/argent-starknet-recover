import ora from "ora";
import {
  Account as SNAccount,
  ec,
  SequencerProvider,
  stark,
  hash,
} from "starknet-490";
import { PROXY_CONTRACT_CLASS_HASHES } from "../../getAccounts";
import { getVersion } from "../../getVersion";
import { oraLog } from "../../oraLog";
import { Account } from "../../ui/pickAccounts";

export const fix = async (
  accounts: Account[],
  network: "mainnet-alpha" | "goerli-alpha",
  accountsToRecover: string[]
): Promise<void> => {
  const spinner = ora(`Deploying accounts (this may take some time)`).start();
  const provider = new SequencerProvider({ network });

  for (const address of accountsToRecover) {
    const account = accounts.find((a) => a.address === address);
    if (!account) {
      throw new Error(`Account ${address} not found`);
    }
    if (!account.deployImplementation) {
      throw new Error(`Account ${address} has no deployImplementation`);
    }
    const keyPair = ec.getKeyPair(account.privateKey);
    const starkKey = ec.getStarkKey(keyPair);
    const snAccount = new SNAccount(provider, account.address, keyPair);

    const constructorCallData = {
      implementation: account.deployImplementation,
      selector: hash.getSelectorFromName("initialize"),
      calldata: stark.compileCalldata({ signer: starkKey, guardian: "0" }),
    };

    const deployAccountPayload = {
      classHash: PROXY_CONTRACT_CLASS_HASHES[0],
      contractAddress: account.address,
      constructorCalldata: stark.compileCalldata(constructorCallData),
      addressSalt: starkKey,
    };

    const transaction = await snAccount.deployAccount(deployAccountPayload);
    oraLog(spinner, `Transaction ${transaction.transaction_hash} created`);
    await provider.waitForTransaction(transaction.transaction_hash);

    if (account) {
      account.signer = starkKey;
      account.implementation = account.deployImplementation;
      const [newVersion] = await getVersion(
        [account.address],
        account.networkId as any
      );
      account.version = newVersion;
    }

    // wait 1 minute extra to make sure the transaction is mined
    await new Promise((resolve) => setTimeout(resolve, 60000));
  }
  spinner.succeed(`Deployed accounts`);
};
