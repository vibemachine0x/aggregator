import { useAccount } from "./useAccount";

export const useAddress = (): string[] => [useAccount()];
