import { providers } from "ethers";
import { JSON_RPC_PROVIDER } from "src/common/constants";
import { useChainId } from "./useChainId";

export function useSigner(): any {
  return new providers.JsonRpcProvider(JSON_RPC_PROVIDER[useChainId()]);
}
