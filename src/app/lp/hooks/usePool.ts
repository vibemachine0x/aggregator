import { Token } from "@uniswap/sdk-core";
import { Pool } from "@uniswap/v3-sdk";

import { usePoolContract } from "./useContract";
import { useProvider } from "./useProvider";

export function usePool(
  token0: Token | null,
  token1: Token | null,
  fee: number
) {
  const library = useProvider();
  const contract = usePoolContract(token0, token1, fee, library, false);

  const call = async () => {
    if (!contract) {
      return;
    }

    const poolAddress = contract.address.toLowerCase();

    const result = await contract.functions.slot0();
    const sqrtPriceX96 = result[0];
    const tickCurrent = result[1];

    const liquidityResult = await contract.functions.liquidity();
    const liquidity = liquidityResult[0];
    const pool = new Pool(
      token0 as Token,
      token1 as Token,
      fee,
      sqrtPriceX96,
      liquidity,
      tickCurrent
    );
    return {
      pool,
      poolAddress,
    };
  };

  call();
}
