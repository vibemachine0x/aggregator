import { getAddress } from "@ethersproject/address";
import { AddressZero } from "@ethersproject/constants";
import { Contract } from "@ethersproject/contracts";
import { BaseProvider, JsonRpcSigner } from "@ethersproject/providers";
import { Token } from "@uniswap/sdk-core";
import V3PoolABI from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";
import NFTPositionManagerABI from "@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json";
import { Pool } from "@uniswap/v3-sdk";
import ERC20_ABI from "src/common/abis/erc20.json";
import ERC20_BYTES32_ABI from "src/common/abis/erc20_bytes32.json";

import PerpOrderBookABI from "@perp/curie-contract/artifacts/contracts/OrderBook.sol/OrderBook.json";
import PerpMainMetadataOptimism from "@perp/curie-contract/metadata/optimism.json";

import { NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from "src/common/constants";
import { NonfungiblePositionManager } from "../types/NonfungiblePositionManager";
import { useAccount } from "./useAccount";
import { useChainId } from "./useChainId";
import { useProvider } from "./useProvider";
import { useSigner } from "./useSigner";

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  try {
    return getAddress(value);
  } catch {
    return false;
  }
}

// account is optional
export function getProviderOrSigner(
  library: BaseProvider,
  signer: JsonRpcSigner,
  account?: string
): BaseProvider | JsonRpcSigner {
  return account && signer ? signer : library;
}

export function getContract(
  address: string,
  ABI: any,
  library: BaseProvider,
  signer: JsonRpcSigner,
  account?: string
): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }

  return new Contract(
    address,
    ABI,
    getProviderOrSigner(library, signer, account) as any
  );
}

// returns null on errors
export function useContract(
  address: string | undefined,
  ABI: any,
  withSignerIfPossible = true,
  customProvider?: BaseProvider
): Contract | null {
  const account = useAccount();
  const defaultProvider = useProvider();
  const signer = useSigner();

  const library = customProvider || defaultProvider;

  return (() => {
    if (!address || !ABI || !library) return null;
    try {
      return getContract(
        address,
        ABI?.abi,
        library,
        signer! as JsonRpcSigner,
        withSignerIfPossible && account ? account : undefined
      );
    } catch (error) {
      console.error("Failed to get contract", error);
      return null;
    }
  })();
}

// returns null on errors
export function useContractBulk(
  addresses: (string | undefined)[],
  ABI: any,
  withSignerIfPossible = true,
  customProvider?: BaseProvider
): (Contract | null)[] {
  const account = useAccount();
  const defaultProvider = useProvider();
  const { data: signer } = useSigner();

  const library = customProvider || defaultProvider;

  return (() => {
    try {
      return addresses.map((address) => {
        if (!address || !ABI || !library) return null;
        return getContract(
          address,
          ABI,
          library,
          signer! as JsonRpcSigner,
          withSignerIfPossible && account ? account : undefined
        );
      });
    } catch (error) {
      console.error("Failed to get contract", error);
      return [];
    }
  })();
}

export function useV3NFTPositionManagerContract(): NonfungiblePositionManager | null {
  const chainId = useChainId();
  const address = chainId
    ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId as number]
    : undefined;
  return useContract(
    address,
    NFTPositionManagerABI
  ) as NonfungiblePositionManager | null;
}

export function useTokenContracts(
  addresses: string[],
  withSignerIfPossible?: boolean
): (Contract | null)[] {
  return useContractBulk(addresses, ERC20_ABI, withSignerIfPossible);
}

export function useBytes32TokenContracts(
  addresses: string[],
  withSignerIfPossible?: boolean
): (Contract | null)[] {
  return useContractBulk(addresses, ERC20_BYTES32_ABI, withSignerIfPossible);
}

export function usePoolContract(
  token0: Token | null,
  token1: Token | null,
  fee: number,
  providerLibrary?: BaseProvider,
  withSignerIfPossible?: boolean
): Contract | null {
  const address =
    token0 && token1 && !token0.equals(token1)
      ? Pool.getAddress(token0, token1, fee)
      : undefined;
  return useContract(address, V3PoolABI, withSignerIfPossible, providerLibrary);
}

export interface PoolParams {
  key: string;
  token0: Token | null;
  token1: Token | null;
  fee: number;
  quoteToken?: Token;
  baseToken?: Token;
}

export function usePoolContracts(
  addresses: string[],
  providerLibrary?: BaseProvider,
  withSignerIfPossible?: boolean
): (Contract | null)[] {
  return useContractBulk(
    addresses,
    V3PoolABI,
    withSignerIfPossible,
    providerLibrary
  );
}

export function usePerpOrderBookContract(
  providerLibrary?: BaseProvider,
  withSignerIfPossible?: boolean
) {
  const { contracts } = PerpMainMetadataOptimism;
  const { address } = contracts.OrderBook;

  return useContract(
    address,
    PerpOrderBookABI,
    withSignerIfPossible,
    providerLibrary
  );
}
