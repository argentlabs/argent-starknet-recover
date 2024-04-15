import { utils } from "ethers";
import { num, CallData } from "starknet";
import { number, uint256 } from "starknet-410";
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
        calldata: CallData.compile({
          to: newAddress.toLowerCase(),
          value: uint256.bnToUint256(
            number.toBN(
              utils.parseUnits(balance, tokenDetails?.decimals || 18).toString()
            )
          ),
        }),
      };
    });

  if (calls.length) {
    const result = await estimateFee(acc, calls);
    const suggestedMaxFee = result.suggestedMaxFee || result.overall_fee;

    const callsWithFee = calls
      .map((c) => {
        const tokenDetails = tokens.find((t) => t.symbol === "ETH");
        if (c.contractAddress === tokenDetails?.address) {
          const balance = acc.balances[c.contractAddress];
          const amount = utils
            .parseUnits(balance, tokenDetails?.decimals ?? 18)
            .sub(num.toHex(suggestedMaxFee));

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
            calldata: CallData.compile({
              to: newAddress.toLowerCase(),
              value: uint256.bnToUint256(number.toBN(amount.toString())),
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
