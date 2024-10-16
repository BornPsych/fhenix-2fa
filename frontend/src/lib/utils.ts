import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { toast } from '@/hooks/use-toast';

// This is the id used for fhenix-2fa
export const FHENIX_CHAIN_NAME = 'Fhenix Local Network';
export const FHENIX_NETWORK_ID = '0x64ABA';
export const FHENIX_RPC_URL = 'http://localhost:42069';
export const FHENIX_SYMBOL = 'FHE';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function addCustomChain(provider: any) {
  try {
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: FHENIX_NETWORK_ID,
          chainName: FHENIX_CHAIN_NAME,
          nativeCurrency: {
            name: FHENIX_SYMBOL,
            symbol: FHENIX_SYMBOL,
            decimals: 18,
          },
          rpcUrls: [FHENIX_RPC_URL],
        },
      ],
    });
  } catch (error) {
    toast({
      title: 'Failed to add network',
      description: 'Please add the network manually',
    });
  }
}

export async function switchToCustomChain() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: FHENIX_NETWORK_ID }],
    });
  } catch (error) {
    toast({
      title: 'Failed to switch network',
      description: 'Please change the network manually',
    });
  }
}

export const checkNetwork = async () => {
  if (window.ethereum.networkVersion !== FHENIX_NETWORK_ID) {
    try {
      await switchToCustomChain();
    } catch (error) {
      toast({
        title: 'Failed to change wallet',
      });
    }
  }
};
