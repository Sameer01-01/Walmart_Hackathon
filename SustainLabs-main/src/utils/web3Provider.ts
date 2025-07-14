import { Buffer } from 'buffer';
import WalletConnectProvider from '@walletconnect/web3-provider';

// Ensure Buffer is available globally
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
  window.global = window;
}

// Create and configure WalletConnect provider
export const createWalletConnectProvider = (infuraId: string) => {
  return new WalletConnectProvider({
    infuraId,
    rpc: {
      1: `https://mainnet.infura.io/v3/${infuraId}`,
      11155111: `https://sepolia.infura.io/v3/${infuraId}`
    }
  });
}; 