import { BigNumber, Wallet } from "ethers";
import { ec, number } from "starknet";
import { BASE_DERIVATION_PATHS } from "./getAccounts";
import { getPathForIndex, getStarkPair } from "./keyDerivation";

export function equalSigner(a: string, b: string): boolean {
  return BigNumber.from(a).eq(b);
}

interface Signer {
  signer: string;
  privateKey: string;
  derivationPath?: string;
}

const amountOfSignersToGenerate = 20;

export function getDefaultSigners(seedPhrase?: string): Array<Signer> {
  if (!seedPhrase) {
    return [];
  }
  const privateKey = Wallet.fromMnemonic(seedPhrase).privateKey;
  const arr = new Array(amountOfSignersToGenerate).fill(0);
  const keypairs = BASE_DERIVATION_PATHS.flatMap((p) =>
    arr.map((_, i) => ({
      keyPair: getStarkPair(i, privateKey, p),
      derivationPath: getPathForIndex(i, p),
    }))
  );
  return keypairs.map(({ keyPair, ...rest }) => ({
    ...rest,
    signer: ec.getStarkKey(keyPair),
    privateKey: number.toHex(number.toBN(keyPair.getPrivate().toString())),
  }));
}
