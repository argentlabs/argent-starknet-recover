import { BigNumber, utils } from "ethers";
import {
  Account as SNAccount,
  ec,
  number,
  SequencerProvider,
  uint256,
} from "starknet";
import { compileCalldata } from "starknet/dist/utils/stark";
import { Account } from "../../ui/pickAccounts";
import TOKENS from "../../default-tokens.json";
import { Ora } from "ora";
import { oraLog } from "../../oraLog";

export async function transferAll(acc: Account, newAddress: string, ora: Ora) {
  const { privateKey } = acc;
  if (!privateKey) {
    throw new Error("No private key for account to credit");
  }
  const keyPair = ec.getKeyPair(privateKey);
  const starkKey = ec.getStarkKey(keyPair);
  if (!BigNumber.from(acc.signer).eq(starkKey)) {
    throw new Error(
      "Account cant be controlled with the selected private key or seed"
    );
  }

  const provider = new SequencerProvider({ network: acc.networkId as any });
  const account = new SNAccount(provider, acc.address.toLowerCase(), keyPair);
  const tokens = TOKENS.filter((t) => t.network === acc.networkId);
  const calls = Object.entries(acc.balances)
    .filter(([, balance]) => utils.parseEther(balance).gt(0))
    .map(([token, balance]) => {
      const tokenDetails = tokens.find((t) => t.address === token);
      return {
        contractAddress: token,
        entrypoint: "transfer",
        calldata: compileCalldata({
          to: newAddress.toLowerCase(),
          value: {
            type: "struct",
            ...uint256.bnToUint256(
              number.toBN(
                utils
                  .parseUnits(balance, tokenDetails?.decimals || 18)
                  .toString()
              )
            ),
          },
        }),
      };
    });

  if (calls.length) {
    const { suggestedMaxFee } = await account.estimateFee(calls);

    const callsWithFee = calls.map((c) => {
      const tokenDetails = tokens.find((t) => t.symbol === "ETH");
      if (c.contractAddress === tokenDetails?.address) {
        const balance = acc.balances[c.contractAddress];
        return {
          ...c,
          calldata: compileCalldata({
            to: newAddress,
            value: {
              type: "struct",
              ...uint256.bnToUint256(
                number.toBN(
                  utils
                    .parseUnits(balance, tokenDetails?.decimals ?? 18)
                    .sub(number.toHex(suggestedMaxFee))
                    .toString()
                )
              ),
            },
          }),
        };
      }
      return c;
    });

    // execute with suggested max fee substracted from a potential eth transfer
    const transaction = await account.execute(callsWithFee, undefined, {
      maxFee: suggestedMaxFee,
    });

    oraLog(ora, `Transaction ${transaction.transaction_hash} created`);

    await provider.waitForTransaction(transaction.transaction_hash);
  }
}
