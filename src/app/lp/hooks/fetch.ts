import { BigNumber } from "@ethersproject/bignumber";
import { uniqBy } from "lodash";

import { TxTypes } from "../types/enums";

export interface TransactionV2 {
  id: string;
  tokenId: number;
  amount0: string;
  amount1: string;
  transactionType: number;
  liquidity: string;
  transactionHash: string;
  timestamp: string;
  gas?: string;
  gasPrice?: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
  l1Fee?: string;
}

export interface PositionStateV2 {
  positionId: number;
  tickLower: number;
  tickUpper: number;
  pool: string;
  owner: string;
  liquidity: BigNumber;
  transactions: TransactionV2[];
}

export interface PoolStateV2 {
  address: string;
  tickSpacing: number;
  fee: number;
  token0: any;
  token1: any;
  sqrtPriceX96: string;
  liquidity: string;
  tick: number;
}

interface UncollectedFeesInputPosition {
  tokenId: number;
  tickLower: number;
  tickUpper: number;
}

interface UncollectedFeesInput {
  address: string;
  currentTick: number;
  positions: UncollectedFeesInputPosition[];
}

interface UncollectedFeesResult {
  tokenId: number;
  amount0: number;
  amount1: number;
}

export interface TokenBalance {
  address: string;
  balance: string;
  metadata: { symbol: string; name: string; logo: string; decimals: number };
  priceTick: number | null;
}

export function useFetchPositions(
  chainId: number,
  addresses: string[],
  timestamp: number
): { loading: boolean; positionStates: PositionStateV2[] } {
  const _call = async () => {
    const url =
      "https://a988aiwz94.execute-api.us-east-2.amazonaws.com/positions";
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ chainId, addresses, timestamp }),
    });
    if (!res.ok) {
      const errors = await res.json();
      console.error(errors);
      return [];
    }

    const results = await res.json();

    const positions: PositionStateV2[] = [];
    results.forEach((resultsByAddress: any[], idx: number) => {
      resultsByAddress.forEach((result: any) => {
        // calculate position liquidity
        let positionLiquidity = BigNumber.from(0);
        // remove duplicate transactions
        const txs = uniqBy(result.transactions, "id");
        txs.forEach(({ transactionType, liquidity }: any) => {
          if (transactionType === TxTypes.Add) {
            positionLiquidity = positionLiquidity.add(
              BigNumber.from(liquidity)
            );
          } else if (transactionType === TxTypes.Remove) {
            positionLiquidity = positionLiquidity.sub(
              BigNumber.from(liquidity)
            );
          }
        });

        // TODO: calculate uncollected fees
        let uncollectedFees = BigNumber.from(0);

        positions.push({
          ...result,
          transactions: txs,
          liquidity: positionLiquidity,
          uncollectedFees,
          owner: addresses[idx],
        });
      });
    });
    return positions;
  };

  if (!addresses.length) {
    return;
  }

  _call();
}

export function useFetchPools(
  chainId: number,
  addresses: string[]
): { loading: boolean; poolStates: PoolStateV2[] } {
  const _call = async () => {
    const url =
      "https://a988aiwz94.execute-api.us-east-2.amazonaws.com/v2/pools";
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ chainId, addresses }),
    });
    if (!res.ok) {
      const errors = await res.json();
      console.error(errors);
      return;
    }

    let pools = await res.json();
    console.log("pools", pools);

    // Pools should not be null (null pools are usually a result of data indexing error)
    // however there can be pools without any liquidity - we'd filter them out
    pools = pools.filter(
      (pool: any) => pool && pool.liquidity.length && pool.sqrtPriceX96.length
    );
    return pools;
  };

  if (!addresses.length) {
    return;
  }

  _call();
}

export function useFetchUncollectedFees(
  chainId: number,
  pools: UncollectedFeesInput[]
): { loading: boolean; uncollectedFees: UncollectedFeesResult[][] } {
  const _call = async () => {
    const url = "https://a988aiwz94.execute-api.us-east-2.amazonaws.com/fees";
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ chainId, pools }),
    });
    if (!res.ok) {
      const errors = await res.json();
      console.error(errors);
      return;
    }

    const results = await res.json();
    return results;
  };

  if (!pools.length) {
    return;
  }

  _call();
}

export function useFetchPriceFeed(
  chainId: number,
  tokens: string[],
  timestamp?: number
): { loading: boolean; priceFeed: { [pool: string]: number } } {
  const _call = async () => {
    const url = "https://a988aiwz94.execute-api.us-east-2.amazonaws.com/prices";
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ chainId, tokens }),
    });
    if (!res.ok) {
      const errors = await res.json();
      console.error(errors);

      return;
    }

    const results = await res.json();
    return results;
  };

  if (!tokens || !tokens.length) {
    return;
  }

  _call();
}

export function useFetchTokenBalances(
  chainId: number,
  address: string
): { loading: boolean; tokenBalances: TokenBalance[] } {
  const _call = async () => {
    const url =
      "https://a988aiwz94.execute-api.us-east-2.amazonaws.com/token_balances";
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ chainId, address }),
    });
    if (!res.ok) {
      const errors = await res.json();
      console.error(errors);
      return;
    }

    const results = await res.json();
    return results;
  };

  if (!address || address === "") {
    return;
  }

  _call();
}
