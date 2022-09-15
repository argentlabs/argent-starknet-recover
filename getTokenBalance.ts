import { chunk } from "lodash";
import MULTICALL_ABI from "./abi/Multicall.json";
import TOKENS from "./default-tokens.json";
import {
  SequencerProvider,
  Contract as SNContract,
  Abi,
  stark,
  hash,
  number,
  uint256,
} from "starknet";
import { formatTokenBalance } from "./formatTokenBalance";

const CHUNK_SIZE = 10;
const MULTICALL_ADDRESS = {
  "mainnet-alpha":
    "0x0740a7a14618bb7e4688d10059bc42104d22c315bb647130630c77d3b6d3ee50",
  "goerli-alpha":
    "0x042a12c5a641619a6c58e623d5735273cdfb0e13df72c4bacb4e188892034bd6",
};

export async function getBalances(
  addresses: string[],
  network: "mainnet-alpha" | "goerli-alpha"
) {
  const tokens = TOKENS.filter((token) => token.network === network);
  const tokenAddresses = tokens.map((token) => token.address);
  const provider = new SequencerProvider({ network });
  const multicallContract = new SNContract(
    MULTICALL_ABI as Abi,
    MULTICALL_ADDRESS[network],
    provider
  );

  const addressesTokensCombinations = tokenAddresses.flatMap((token) =>
    addresses.map((address) => ({ address, token }))
  );

  const calls = addressesTokensCombinations.flatMap(({ address, token }) => {
    const compiledCalldata = stark.compileCalldata({
      address,
    });
    return [
      token,
      hash.getSelectorFromName("balanceOf"),
      compiledCalldata.length,
      ...compiledCalldata,
    ];
  });

  const chunks = chunk(calls, CHUNK_SIZE * 4);
  const results: string[] = [];
  for (const lChunk of chunks) {
    const response = await multicallContract.aggregate(lChunk);
    const lResults: string[] = response.result.map((res: any) =>
      number.toHex(res)
    );
    const resultChunks = chunk(lResults, 2);
    const balances = resultChunks.reduce((acc, result) => {
      const balance = uint256
        .uint256ToBN({ low: result[0], high: result[1] })
        .toString();

      acc.push(balance);
      return acc;
    }, [] as string[]);
    results.push(...balances);
  }

  if (addressesTokensCombinations.length !== results.length) {
    throw new Error("Something went wrong");
  }

  return addressesTokensCombinations.map((addressToken, index) => ({
    address: addressToken.address,
    token: addressToken.token,
    balance: formatTokenBalance(
      results[index],
      tokens.find((x) => x.address === addressToken.token)!.decimals
    ),
  }));
}
