import { Account as LatestAccount } from "starknet";
import { Account as Account4220 } from "starknet-4220";
import {
  Call,
  RpcProvider as OldRpcProvider,
  Account as OldAccount,
  ec,
} from "starknet-410";
import { BigNumber } from "ethers";
import { Account } from "./ui/pickAccounts";
import { lte } from "semver";
import {
  getProvider4220ForNetworkId,
  getProviderForNetworkId,
  getRpcNodeUrlForNetworkId,
} from "./getProvider";

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
    if (!account.privateKey) {
      throw new Error("Account private key is missing");
    }
    const provider = getProviderForNetworkId(account.networkId);
    const a = new LatestAccount(provider, lowerCaseAddress, account.privateKey);
    return await a.estimateFee(calls);
  } catch (e) {
    console.warn(
      `Fallback to old provider - estimateFee error ${e}`,
      (e as any)?.errorCode
    );
  }

  try {
    const provider = getProvider4220ForNetworkId(account.networkId);
    const a = new Account4220(provider, lowerCaseAddress, keyPair);
    return a.estimateFee(calls);
  } catch (e) {
    console.warn(
      `Fallback to old provider - estimateFee error ${e}`,
      (e as any)?.errorCode
    );
  }

  try {
    const provider = new OldRpcProvider({ nodeUrl });
    const a = new OldAccount(provider, lowerCaseAddress, keyPair);
    return await a.estimateFee(calls);
  } catch (e) {
    console.warn(
      `Oldest provider failed - estimateFee error ${e}`,
      (e as any)?.errorCode
    );
  }
  throw new Error("Estimate fee failed");
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
      const provider = new OldRpcProvider({ nodeUrl });
      const a = new OldAccount(provider, lowerCaseAddress, keyPair);
      return await a.execute(calls);
    } catch (e) {
      console.warn(
        `Fallback to old provider - estimateFee error ${e}`,
        (e as any)?.errorCode
      );
    }
    try {
      const provider = getProvider4220ForNetworkId(account.networkId);
      const a = new Account4220(provider, lowerCaseAddress, keyPair);
      return await a.execute(calls);
    } catch (e) {
      console.warn(
        `Oldest provider failed - execute error ${e}`,
        (e as any)?.errorCode
      );
    }
  } else {
    try {
      if (!account.privateKey) {
        throw new Error("Account private key is missing");
      }
      const provider = getProviderForNetworkId(account.networkId);
      const a = new LatestAccount(
        provider,
        lowerCaseAddress,
        account.privateKey
      );
      return await a.execute(calls);
    } catch (e) {
      console.warn(
        `Fallback to older provider - execute error ${e}`,
        (e as any)?.errorCode
      );
    }

    try {
      const provider = getProvider4220ForNetworkId(account.networkId);
      const a = new Account4220(provider, lowerCaseAddress, keyPair);
      return await a.execute(calls);
    } catch (e) {
      console.warn(
        `Fallback to older provider - execute error ${e}`,
        (e as any)?.errorCode
      );
    }

    try {
      const provider = new OldRpcProvider({ nodeUrl });
      const a = new OldAccount(provider, lowerCaseAddress, keyPair);
      return await a.execute(calls);
    } catch (e) {
      console.warn(
        `Oldest provider failed - execute error ${e}`,
        (e as any)?.errorCode
      );
    }
  }
  throw new Error("Execute transation failed");
}
