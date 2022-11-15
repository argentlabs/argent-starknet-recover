import { utils, Wallet } from "ethers";
import { Ora } from "ora";
import prompts from "prompts";
import {
  getAccountsByPrivateKey,
  getAccountsBySeedPhrase,
} from "../getAccounts";
import { hexValue, numberValue } from "../schema";

export const getAccountsAndNetwork = async (ora: Ora) => {
  const {
    seedOrPrivateKey,
    network,
  }: {
    seedOrPrivateKey: string;
    network: "mainnet-alpha" | "goerli-alpha";
  } = await prompts(
    [
      {
        type: "select",
        name: "network",
        message: "Choose network",
        choices: [
          { title: "SN Mainnet", value: "mainnet-alpha" },
          { title: "SN Testnet", value: "goerli-alpha" },
        ],
      },
      {
        type: "select",
        name: "seedOrPrivateKey",
        message: "Do you want to recover by seed or by private key?",
        choices: [
          { title: "Seed", value: "seed" },
          { title: "Private Key", value: "privateKey" },
        ],
      },
    ],
    { onCancel: () => process.exit(1) }
  );

  if (seedOrPrivateKey === "seed") {
    const { seed }: { seed: string } = await prompts(
      {
        type: "text",
        name: "seed",
        message: "Enter your seed",
        mask: "*",
        validate: (value) => {
          try {
            utils.HDNode.fromMnemonic(value);
          } catch {
            return "Invalid seed";
          }
          return true;
        },
      },
      { onCancel: () => process.exit(1) }
    );

    ora.start("Discovering Accounts");
    const accounts = await getAccountsBySeedPhrase(seed, network);
    return {
      accounts,
      network,
      seed,
    };
  } else if (seedOrPrivateKey === "privateKey") {
    const { privateKey }: { privateKey: string } = await prompts(
      [
        {
          type: "text",
          name: "privateKey",
          message: "Enter your private key",
          mask: "*",
          validate: async (value) => {
            try {
              const settledPromises = await Promise.allSettled([
                hexValue.validate(value),
                numberValue.validate(value),
              ]);
              if (
                settledPromises.every(({ status }) => status === "rejected")
              ) {
                return "Please input hex or number";
              }
            } catch (e) {
              return "Invalid private key";
            }
            return true;
          },
        },
      ],
      { onCancel: () => process.exit(1) }
    );

    ora.start("Discovering Accounts");
    const accounts = await getAccountsByPrivateKey(privateKey, network);
    return { accounts, network, privateKey };
  } else {
    throw new Error("Invalid seedOrPrivateKey");
  }
};
