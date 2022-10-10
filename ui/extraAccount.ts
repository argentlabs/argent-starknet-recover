import { isString } from "lodash";
import prompts from "prompts";
import { ValidationError } from "yup";
import { addressSchema } from "../schema";

export async function extraAccount(
  network: "mainnet-alpha" | "goerli-alpha",
  privateKey: string
): Promise<
  {
    address: string;
    networkId: string;
    privateKey: string;
  }[]
> {
  const { extraWalletAddress } = await prompts(
    [
      {
        type: "text",
        name: "extraWalletAddress",
        message: "Enter wallet address you want to use",
        validate: async (value: string, prev) => {
          try {
            const address = value.replace(" ", "");
            if (!address.length) {
              return "You must select one account";
            }
            try {
              await addressSchema.validate(address);
            } catch (e) {
              return `Invalid address '${address}'.${
                e instanceof ValidationError ? ` Reason: ${e.message}` : ""
              }`;
            }
          } catch (e) {
            return "Invalid address";
          }
          return true;
        },
      },
    ],
    { onCancel: () => process.exit(1) }
  );

  if (!isString(extraWalletAddress)) {
    throw new Error("Invalid address");
  }

  return [
    {
      address: extraWalletAddress,
      networkId: network,
      privateKey,
    },
  ];
}
