import MULTICALL_ABI from "./abi/Multicall.json";
import {
  SequencerProvider,
  Contract as SNContract,
  Abi,
  stark,
  hash,
  number,
  shortString,
} from "starknet";

const MULTICALL_ADDRESS = {
  "mainnet-alpha":
    "0x0740a7a14618bb7e4688d10059bc42104d22c315bb647130630c77d3b6d3ee50",
  "goerli-alpha":
    "0x042a12c5a641619a6c58e623d5735273cdfb0e13df72c4bacb4e188892034bd6",
};

export async function getVersion(
  addresses: string[],
  network: "mainnet-alpha" | "goerli-alpha"
) {
  const provider = new SequencerProvider({ network });
  const multicallContract = new SNContract(
    MULTICALL_ABI as Abi,
    MULTICALL_ADDRESS[network],
    provider
  );

  const calls = addresses.flatMap((address) => {
    const compiledCalldata = stark.compileCalldata({});
    return [
      address,
      hash.getSelectorFromName("get_version"),
      compiledCalldata.length,
      ...compiledCalldata,
    ];
  });

  const response = await multicallContract.aggregate(calls);

  const results: string[] = response.result.map((res: any) =>
    shortString.decodeShortString(number.toHex(res))
  );

  return results;
}
