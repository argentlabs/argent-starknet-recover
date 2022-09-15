import { BigNumber, utils } from "ethers";

const formatTokenBalanceToCharLength =
  (length: number) =>
  (balance: string = "0", decimals = "18"): string => {
    const balanceBn = BigNumber.from(balance);
    const balanceFullString = utils.formatUnits(balanceBn, decimals);

    // show max ${length} characters or what's needed to show everything before the decimal point
    const balanceString = balanceFullString.slice(
      0,
      Math.max(length, balanceFullString.indexOf("."))
    );

    // make sure seperator is not the last character, if so remove it
    // remove unnecessary 0s from the end, except for ".0"
    let cleanedBalanceString = balanceString
      .replace(/\.$/, "")
      .replace(/0+$/, "");
    if (cleanedBalanceString.endsWith(".")) {
      cleanedBalanceString += "0";
    }

    return cleanedBalanceString;
  };

export const formatTokenBalance = formatTokenBalanceToCharLength(9);
