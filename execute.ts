import {
  RpcProvider as NewRpcProvider,
  Account as NewAccount,
} from "starknet-4220";
import {
  Call,
  RpcProvider as OldRpcProvider,
  Account as OldAccount,
  ec,
} from "starknet";
import { BigNumber } from "ethers";
import { Account } from "./ui/pickAccounts";
import { lte } from "semver";
import { getRpcNodeUrlForNetworkId } from "./getProvider";

export async function estimateFee(account: Account, call: Call[] | Call) {
  const calls = Array.isArray(call) ? call : [call];
  const lowerCaseAddress = account.address.toLowerCase();
  const keyPair = ec.getKeyPair(account.privateKey);
  const starkKey = ec.getStarkKey(keyPair);
  if (!BigNumber.from(account.signer).eq(starkKey)) {
    throw new Error(
      "Account cant be controlled with the selected private key or seed"
    );
  }
  const nodeUrl = getRpcNodeUrlForNetworkId(account.networkId);
  try {
    const oldRpcProvider = new OldRpcProvider({ nodeUrl });
    const a = new OldAccount(oldRpcProvider, lowerCaseAddress, keyPair);
    return await a.estimateFee(calls);
  } catch {
    const newRpcProvider = new NewRpcProvider({ nodeUrl });
    const a = new NewAccount(newRpcProvider, lowerCaseAddress, keyPair);
    return a.estimateFee(calls);
  }
}

export async function execute(account: Account, call: Call[] | Call) {
  const calls = Array.isArray(call) ? call : [call];
  const lowerCaseAddress = account.address.toLowerCase();
  const keyPair = ec.getKeyPair(account.privateKey);
  const starkKey = ec.getStarkKey(keyPair);
  if (!BigNumber.from(account.signer).eq(starkKey)) {
    throw new Error(
      "Account cant be controlled with the selected private key or seed"
    );
  }
  const nodeUrl = getRpcNodeUrlForNetworkId(account.networkId);
  if (account.version && lte(account.version, "0.2.2")) {
    try {
      const oldRpcProvider = new OldRpcProvider({ nodeUrl });
      const a = new OldAccount(oldRpcProvider, lowerCaseAddress, keyPair);
      return await a.execute(calls);
    } catch (e) {
      console.warn("Fallback to new provider", (e as any)?.errorCode);
      const newRpcProvider = new NewRpcProvider({ nodeUrl });
      const a = new NewAccount(newRpcProvider, lowerCaseAddress, keyPair);
      return await a.execute(calls);
    }
  } else {
    try {
      const newRpcProvider = new NewRpcProvider({ nodeUrl });
      const a = new NewAccount(newRpcProvider, lowerCaseAddress, keyPair);
      return await a.execute(calls);
    } catch (e) {
      console.warn("Fallback to old provider", (e as any)?.errorCode);
      const oldRpcProvider = new OldRpcProvider({ nodeUrl });
      const a = new OldAccount(oldRpcProvider, lowerCaseAddress, keyPair);
      return await a.execute(calls);
    }
  }
}
