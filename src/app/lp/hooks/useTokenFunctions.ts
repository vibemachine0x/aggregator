import { BigNumber } from "@ethersproject/bignumber";
import { MaxUint256 } from "@ethersproject/constants";
import { TransactionResponse } from "@ethersproject/providers";
import { parseBytes32String } from "@ethersproject/strings";
import { formatUnits } from "@ethersproject/units";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";

import { WETH9, WMATIC } from "src/common/constants";
import { useBytes32TokenContracts, useTokenContracts } from "./useContract";
import { useProvider } from "./useProvider";

const callContract = async (
  contracts: any[],
  bytes32Contracts: any[],
  idx: number,
  fn: string,
  args: any[]
): Promise<any> => {
  try {
    const contract = contracts[idx];
    if (!contract) {
      throw new Error("Contract not found");
    }
    const r = await contract.functions[fn](...args);
    return r[0];
  } catch (e) {
    const bc = bytes32Contracts[idx];
    if (!bc || !bc.functions[fn]) {
      return null;
    }
    // try bytes32 value if name is empty
    const r = await bc.functions[fn](...args);
    return parseBytes32String(r[0]);
  }
};

export function useTokenFunctions(
  tokens: Token[],
  owner: string | null | undefined,
  nativeBalance: boolean = true
): {
  getBalances: () => Promise<string[]>;
  getAllowances: (spender: string) => Promise<number[]>;
  approveToken: (
    token: Token,
    spender: string,
    amount: number
  ) => Promise<TransactionResponse | null>;
} {
  const library = useProvider();

  const addresses = tokens.map((token) => token.address);
  const contracts = useTokenContracts(addresses);
  const bytes32Contracts = useBytes32TokenContracts(addresses);

  const getBalances = async (): Promise<string[]> => {
    if (
      !library ||
      !tokens.length ||
      !owner ||
      !contracts ||
      !bytes32Contracts
    ) {
      return [];
    }

    const shouldReturnNative = (token: Token) => {
      return token.chainId === 137
        ? token.equals(WMATIC[token.chainId])
        : token.equals(WETH9[token.chainId]);
    };

    return await Promise.all(
      tokens.map(async (token: Token, idx: number) => {
        const balance =
          nativeBalance && shouldReturnNative(token)
            ? await library.getBalance(owner)
            : await callContract(
                contracts,
                bytes32Contracts,
                idx,
                "balanceOf",
                [owner]
              );
        return formatUnits(balance, token.decimals);
      })
    );
  };

  const getAllowances = async (spender: string): Promise<number[]> => {
    if (
      !library ||
      !tokens.length ||
      !owner ||
      !contracts ||
      !bytes32Contracts
    ) {
      return [];
    }
    return await Promise.all(
      tokens.map(async (token: Token, idx: number) => {
        const allowance = await callContract(
          contracts,
          bytes32Contracts,
          idx,
          "allowance",
          [owner, spender]
        );
        if (allowance === null) {
          return 0;
        }
        return parseFloat(
          CurrencyAmount.fromRawAmount(
            token,
            allowance.toString()
          ).toSignificant(16)
        );
      })
    );
  };

  const approveToken = async (
    token: Token,
    spender: string,
    amount: number
  ): Promise<TransactionResponse | null> => {
    if (!library || !addresses || !contracts || !tokens) {
      return null;
    }

    const idx = addresses.findIndex((addr) => token.address === addr);
    const contract = contracts[idx];
    if (!contract) {
      return null;
    }

    // inflate the approval amount by 20% to avoid rounding errors
    const inflatedAmount = amount * 1.2;
    const amountToApprove = CurrencyAmount.fromRawAmount(
      token,
      Math.ceil(inflatedAmount * Math.pow(10, token.decimals))
    ).quotient.toString();
    let estimatedGas = BigNumber.from(0);
    let useExact = false;
    try {
      estimatedGas = await contract.estimateGas.approve(spender, MaxUint256);
    } catch (e) {
      // fallback for tokens who restrict approval amounts
      estimatedGas = await contract.estimateGas.approve(
        spender,
        amountToApprove
      );
      useExact = true;
    }

    return contract.approve(spender, useExact ? amountToApprove : MaxUint256, {
      gasLimit: estimatedGas
        .mul(BigNumber.from(10000 + 2000))
        .div(BigNumber.from(10000)),
    });
  };

  return { getBalances, getAllowances, approveToken };
}
