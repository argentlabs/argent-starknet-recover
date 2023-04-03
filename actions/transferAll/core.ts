import { BigNumber, utils } from "ethers";
import { number, uint256 } from "starknet";
import { compileCalldata } from "starknet/dist/utils/stark";
import { Account } from "../../ui/pickAccounts";
import TOKENS from "../../default-tokens.json";
import { Ora } from "ora";
import { oraLog } from "../../oraLog";
import { estimateFee, execute } from "../../execute";
import { formatAddress } from "../../addressFormatting";

export async function transferAll(acc: Account, newAddress: string, ora: Ora) {
  const { privateKey } = acc;
  if (!privateKey) {
    throw new Error("No private key for account to credit");
  }

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
    const { suggestedMaxFee } = await estimateFee(acc, calls);

    const callsWithFee = calls
      .map((c) => {
        const tokenDetails = tokens.find((t) => t.symbol === "ETH");
        if (c.contractAddress === tokenDetails?.address) {
          const balance = acc.balances[c.contractAddress];
          const amount = utils
            .parseUnits(balance, tokenDetails?.decimals ?? 18)
            .sub(number.toHex(suggestedMaxFee));

          if (amount.lte(0)) {
            ora.info(
              `Account ${formatAddress(
                acc.address
              )} has not enough ETH to do a transfer`
            );
            return false;
          }

          return {
            ...c,
            calldata: compileCalldata({
              to: newAddress.toLowerCase(),
              value: {
                type: "struct",
                ...uint256.bnToUint256(number.toBN(amount.toString())),
              },
            }),
          };
        }
        return c;
      })
      .filter(Boolean);

    // execute with suggested max fee substracted from a potential eth transfer
    const transaction = await execute(acc, callsWithFee);

    oraLog(ora, `Transaction ${transaction.transaction_hash} created`);

    return transaction.transaction_hash;
  }
}
