import { Wallet } from "ethers";
import { ec, hash, number, stark } from "starknet-410";
import { getBalances } from "./getTokenBalance";
import { getPathForIndex, getStarkPair } from "./keyDerivation";
import { getProvider4220ForNetworkId } from "./getProvider";
import { NetworkId } from "./types";

const CHECK_OFFSET = 10;

export const PROXY_CONTRACT_CLASS_HASHES = [
  "0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918",
];
const ARGENT_ACCOUNT_CONTRACT_CLASS_HASHES = [
  "0x1a7820094feaf82d53f53f214b81292d717e7bb9a92bb2488092cd306f3993f",
  "0x7e28fb0161d10d1cf7fe1f13e7ca57bce062731a3bd04494dfd2d0412699727",
  "0x3e327de1c40540b98d05cbcb13552008e36f0ec8d61d46956d2f9752c294328",
  "0x33434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2",
];

const ARGENT_ACCOUNT_CONTRACT_CLASS_HASHES_CAIRO_1 = [
  "0x29927c8af6bccf3f6fda035981e765a7bdbf18a2dc0d630494f8758aa908e2b",
  "0x02fadbf77a721b94bdcc3032d86a8921661717fa55145bccf88160ee2a5efcd1",
  "0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003",
];

export const BASE_DERIVATION_PATHS = [
  "m/44'/9004'/0'/0",
  "m/2645'/1195502025'/1148870696'/0'/0'",
];

async function getAccountByKeyPair(
  keyPair: ReturnType<typeof getStarkPair>,
  networkId: NetworkId,
  contractClassHash: string,
  accountClassHash: string
) {
  const provider4220 = getProvider4220ForNetworkId(networkId);

  const starkPub = ec.getStarkKey(keyPair);

  const address = hash.calculateContractAddressFromHash(
    starkPub,
    contractClassHash,
    stark.compileCalldata({
      implementation: accountClassHash,
      selector: hash.getSelectorFromName("initialize"),
      calldata: stark.compileCalldata({
        signer: starkPub,
        guardian: "0",
      }),
    }),
    0
  );

  try {
    const ethBalance = await getBalances([address], networkId, ["ETH"]);

    if (ethBalance[0].rawBalance !== "0") {
      return {
        address,
        deployImplementation: accountClassHash,
        networkId: networkId,
        privateKey: number.toHex(number.toBN(keyPair.getPrivate().toString())),
      };
    }

    const code = await provider4220.getCode(address);

    if (code.bytecode.length > 0) {
      return {
        address,
        networkId: networkId,
        deployImplementation: accountClassHash,
        privateKey: number.toHex(number.toBN(keyPair.getPrivate().toString())),
      };
    }
  } catch (e) {
    if ((e as Error).message !== "RPC does not implement getCode function") {
      console.error(e);
    }
  }
}

export async function getAccountsBySeedPhrase(
  seedPhrase: string,
  networkId: NetworkId
) {
  const wallet = Wallet.fromMnemonic(seedPhrase);

  const proxyClassHashAndAccountClassHash2DMap = BASE_DERIVATION_PATHS.flatMap(
    (dp) =>
      PROXY_CONTRACT_CLASS_HASHES.flatMap((contractHash) =>
        ARGENT_ACCOUNT_CONTRACT_CLASS_HASHES.map(
          (implementation) => [contractHash, implementation, dp] as const
        )
      )
  );

  BASE_DERIVATION_PATHS.forEach((dp) => {
    ARGENT_ACCOUNT_CONTRACT_CLASS_HASHES_CAIRO_1.forEach((accountClassHash) => {
      proxyClassHashAndAccountClassHash2DMap.push([
        accountClassHash,
        accountClassHash,
        dp,
      ]);
    });
  });

  const accounts: {
    address: string;
    deployImplementation?: string;
    networkId: string;
    derivationPath: string;
    privateKey: string;
  }[] = [];

  const promises = proxyClassHashAndAccountClassHash2DMap.map(
    async ([contractClassHash, accountClassHash, baseDerivationPath]) => {
      let lastHit = 0;
      let lastCheck = 0;

      while (lastHit + CHECK_OFFSET > lastCheck) {
        const starkPair = getStarkPair(
          lastCheck,
          wallet.privateKey,
          baseDerivationPath
        );

        const account = await getAccountByKeyPair(
          starkPair,
          networkId,
          contractClassHash,
          accountClassHash
        );

        if (account) {
          lastHit = lastCheck;
          accounts.push({
            ...account,
            derivationPath: getPathForIndex(lastCheck, baseDerivationPath),
          });
        }

        ++lastCheck;
      }
    }
  );

  await Promise.all(promises);

  return accounts;
}

export async function getAccountsByPrivateKey(
  privateKey: string,
  networkId: NetworkId
) {
  const proxyClassHashAndAccountClassHash2DMap =
    PROXY_CONTRACT_CLASS_HASHES.flatMap((contractHash) =>
      ARGENT_ACCOUNT_CONTRACT_CLASS_HASHES.map(
        (implementation) => [contractHash, implementation] as const
      )
    );

  const keyPair = ec.getKeyPair(privateKey);

  const accounts: {
    address: string;
    deployImplementation?: string;
    networkId: string;
    privateKey?: string;
  }[] = [];

  const promises = proxyClassHashAndAccountClassHash2DMap.map(
    async ([contractClassHash, accountClassHash]) => {
      const account = await getAccountByKeyPair(
        keyPair,
        networkId,
        contractClassHash,
        accountClassHash
      );

      if (account) {
        accounts.push(account);
      }
    }
  );

  await Promise.all(promises);

  return accounts;
}
