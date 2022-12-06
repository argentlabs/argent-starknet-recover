import { isString } from "lodash";
import prompts from "prompts";
import { ValidationError } from "yup";
import { addressSchema } from "../schema";

export const askForExtraAccounts = async () => {
  // ask "Do you want to add more addresses to recover?"
  const { addMore }: { addMore: boolean } = await prompts(
    {
      type: "confirm",
      name: "addMore",
      message: "Do you want to add more addresses to recover?",
    },
    { onCancel: () => process.exit(1) }
  );

  return addMore;
};

export async function extraAccount(
  network: "mainnet-alpha" | "goerli-alpha"
): Promise<
  {
    address: string;
    networkId: string;
  }[]
> {
  const { extraWalletAddresses: input }: { extraWalletAddresses: string } =
    await prompts(
      [
        {
          type: "text",
          name: "extraWalletAddresses",
          message: "Enter wallet addresses you want to use",
          hint: "separate by comma",
          validate: async (value: string, prev) => {
            try {
              const addresses = value.replace(" ", "").split(",");
              if (!addresses.length) {
                return "You must select at least one account";
              }
              for (const address of addresses) {
                try {
                  await addressSchema.validate(address);
                } catch (e) {
                  return `Invalid address '${address}'.${
                    e instanceof ValidationError ? ` Reason: ${e.message}` : ""
                  }`;
                }
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

  const extraWalletAddresses = input.replace(" ", "").split(",");

  if (!extraWalletAddresses.every(isString)) {
    throw new Error("Invalid address");
  }

  return extraWalletAddresses.map(
    (
      address: string
    ): {
      address: string;
      networkId: string;
    } => ({
      address,
      networkId: network,
    })
  );
}
