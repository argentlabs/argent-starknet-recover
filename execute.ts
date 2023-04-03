import {
  SequencerProvider as NewProvider,
  Account as NewAccount,
} from "starknet-4220";
import {
  Call,
  SequencerProvider as OldProvider,
  Account as OldAccount,
  ec,
} from "starknet";
import { BigNumber } from "ethers";
import { Account } from "./ui/pickAccounts";
import { lte } from "semver";

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
  try {
    const oldProvider = new OldProvider({ network: account.networkId as any });
    const a = new OldAccount(oldProvider, lowerCaseAddress, keyPair);
    return await a.estimateFee(calls);
  } catch {
    const newProvider = new NewProvider({ network: account.networkId as any });
    const a = new NewAccount(newProvider, lowerCaseAddress, keyPair);
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
  if (account.version && lte(account.version, "0.2.2")) {
    try {
      const oldProvider = new OldProvider({
        network: account.networkId as any,
      });
      const a = new OldAccount(oldProvider, lowerCaseAddress, keyPair);
      return await a.execute(calls);
    } catch (e) {
      console.warn("Fallback to new provider", (e as any)?.errorCode);
      const newProvider = new NewProvider({
        network: account.networkId as any,
      });
      const a = new NewAccount(newProvider, lowerCaseAddress, keyPair);
      return await a.execute(calls);
    }
  } else {
    try {
      const newProvider = new NewProvider({
        network: account.networkId as any,
      });
      const a = new NewAccount(newProvider, lowerCaseAddress, keyPair);
      return await a.execute(calls);
    } catch (e) {
      console.warn("Fallback to old provider", (e as any)?.errorCode);
      const oldProvider = new OldProvider({
        network: account.networkId as any,
      });
      const a = new OldAccount(oldProvider, lowerCaseAddress, keyPair);
      return await a.execute(calls);
    }
  }
}
