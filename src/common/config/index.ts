import { ContractInterface } from "ethers";

export const baseUrl = "https://api.dzap.io/";

export interface DeFiContract {
  [key: string]: {
    abi: ContractInterface;
    [key: number]: string;
  };
}

export const defaultSwapVersion = "v1.2";
