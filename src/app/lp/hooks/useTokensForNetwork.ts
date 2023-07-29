import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits } from "@ethersproject/units";
import { Ether, Fraction, Token } from "@uniswap/sdk-core";
import { MATIC } from "src/common/constants";
import { ChainID } from "../types/enums";
import { formatInput } from "../utils/numbers";
import { oneTokenUnit, priceFromTick } from "../utils/tokens";
import { TokenBalance, useFetchTokenBalances } from "./fetch";
import { useAddress } from "./useAddress";

function getTokenOrNative(chainId: number, address: string, metadata: any) {
  if (address === "native") {
    if (chainId === ChainID.Matic) {
      return MATIC[chainId];
    }
    return Ether.onChain(chainId);
  }
  return new Token(
    chainId,
    address,
    metadata.decimals,
    metadata.symbol,
    metadata.name
  );
}

export function useTokensForNetwork(chainId: number) {
  const addresses = useAddress();
  const { tokenBalances } = useFetchTokenBalances(chainId, addresses[0]);

  if (!tokenBalances || !tokenBalances.length) {
    return [];
  }

  return tokenBalances.map(
    ({ address, balance, metadata, priceTick }: TokenBalance) => {
      const token = getTokenOrNative(chainId, address, metadata);
      const balanceFormatted = formatInput(
        parseFloat(formatUnits(balance, token.decimals))
      );

      const price = priceFromTick(token, priceTick);
      const value = price.multiply(
        new Fraction(BigNumber.from(balance).toString(), oneTokenUnit(token))
      );

      return {
        chainId,
        entity: token,
        balance: balanceFormatted,
        price: price,
        value: value,
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
        logo: metadata.logo,
        address,
      };
    }
  );
}
