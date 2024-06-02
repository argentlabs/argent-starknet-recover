import ora from "ora";
import prompts from "prompts";
import { ValidationError } from "yup";
import { addressSchema } from "../../schema";
import { Account } from "../../ui/pickAccounts";
import { transferAll } from "./core";
import { getProviderForNetworkId } from "../../getProvider";

type PromiseFactory<T> = () => Promise<T>;

type PromiseResult<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: any };

async function allSettled<T>(
  promiseFactories: PromiseFactory<T>[]
): Promise<PromiseResult<T>[]> {
  const results: PromiseResult<T>[] = [];

  for (const promiseFactory of promiseFactories) {
    try {
      const value = await promiseFactory();
      results.push({ status: "fulfilled", value });
    } catch (reason) {
      results.push({ status: "rejected", reason });
    }
  }

  return results;
}

export async function showTransferAll(accounts: Account[]) {
  const { toAddress } = await prompts(
    {
      type: "text",
      name: "toAddress",
      message: "Enter the address to transfer to",
      validate: async (value: string) => {
        try {
          await addressSchema.validate(value);
        } catch (e) {
          return `Invalid address '${value}'.${
            e instanceof ValidationError ? ` Reason: ${e.message}` : ""
          }`;
        }

        return true;
      },
    },
    {
      onCancel: () => process.exit(0),
    }
  );

  const spinner = ora("Transferring tokens").start();

  const transferResults = await allSettled(
    accounts.map((acc) => () => transferAll(acc, toAddress, spinner))
  );

  const transactions = transferResults
    .map((result) => {
      if (result.status === "rejected") {
        spinner.fail(result.reason?.toString());
        return undefined;
      }
      return result.value;
    })
    .filter((tx) => !!tx);

  const provider = getProviderForNetworkId(accounts[0].networkId);

  spinner.info(`Waiting for ${transactions.length} transactions`);
  await Promise.all(
    transactions.map((tx) => {
      if (!tx) return;
      return provider.waitForTransaction(tx);
    })
  );

  if (transferResults.every((result) => result.status === "fulfilled")) {
    spinner.succeed("Transfers complete");
  } else if (transferResults.some((result) => result.status === "fulfilled")) {
    spinner.fail("Some transfers failed");
  } else {
    spinner.fail("All transfers failed");
  }
}
