import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";

// Get environment variables
const APTOS_NODE_URL = import.meta.env.VITE_APTOS_NODE_URL || 'https://fullnode.testnet.aptoslabs.com/v1';
const APTOS_CHAIN_ID = import.meta.env.VITE_APTOS_CHAIN_ID || '0x2';
const APTOS_EXPLORER_URL = import.meta.env.VITE_APTOS_EXPLORER_URL || 'https://explorer.aptoslabs.com/?network=testnet';

// Aptos Testnet chain configuration
export const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.OTHER,
  chainId: APTOS_CHAIN_ID, // Testnet chain ID
  rpcTarget: APTOS_NODE_URL,
  displayName: "Aptos Testnet",
  blockExplorerUrl: APTOS_EXPLORER_URL,
  ticker: "APT",
  tickerName: "Aptos",
};

// Create the private key provider for Aptos
export const privateKeyProvider = new CommonPrivateKeyProvider({
  config: { chainConfig },
});

// Web3Auth client ID from environment variables
export const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || "";

// Web3Auth network configuration
export const web3AuthNetwork = import.meta.env.VITE_WEB3AUTH_NETWORK === 'SAPPHIRE_MAINNET' 
  ? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET 
  : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET;

// Default verifier name to use with single-factor-auth
export const verifierName = import.meta.env.VITE_VERIFIER_NAME || "web3auth-aptos-verifier";