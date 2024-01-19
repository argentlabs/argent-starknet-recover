import ora from "ora";
import { getImplementation } from "./getImplementation";
import { getSigners } from "./getSigner";
import { getBalances } from "./getTokenBalance";
import { getVersion } from "./getVersion";
import { NetworkId } from "./types";

export const getAccountInfos = async (
  addresses: string[],
  networkId: NetworkId,
  oraProgress?: ora.Ora
) => {
  const progress = oraProgress ?? ora("Retrieving signers");
  progress.start();
  progress.text = "Retrieving signers";
  const signer = await getSigners(addresses, networkId);
  progress.text = "Retrieving versions";
  const versions = await getVersion(addresses, networkId);
  progress.text = "Retrieving implementations";
  const implementations = await getImplementation(addresses, networkId);
  progress.text = "Retrieving balances";
  const balances = await getBalances(addresses, networkId);
  progress.succeed();

  return addresses.map((address, i) => ({
    address,
    signer: signer[i],
    networkId,
    implementation: implementations[i],
    version: versions[i],
    balances: balances.reduce((acc, x) => {
      if (x.address === address) {
        acc[x.token] = x.balance;
      }
      return acc;
    }, {} as { [token: string]: string }),
  }));
};
