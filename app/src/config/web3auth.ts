import { CHAIN_NAMESPACES, CustomChainConfig } from '@web3auth/base';
import { CommonPrivateKeyProvider } from '@web3auth/base-provider';

// Configuración de red EVM para Web3Auth
// Web3Auth solo soporta redes EVM, usaremos esta configuración para obtener la clave privada
// que luego se usará para derivar la cuenta Stellar
export const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.OTHER,
  chainId: "0x2", // Testnet chain ID
  rpcTarget: "https://fullnode.testnet.aptoslabs.com/v1",
  displayName: "Aptos Testnet",
  blockExplorerUrl: "https://explorer.aptoslabs.com/?network=testnet",
  ticker: "APT",
  tickerName: "Aptos",
};

// Configuración de Web3Auth
export const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || '';
export const web3AuthNetwork = import.meta.env.VITE_WEB3AUTH_NETWORK || 'testnet';
export const verifierName = import.meta.env.VITE_VERIFIER_NAME || "web3auth-stellar-verifier";

// Configurar el privateKeyProvider para Web3Auth usando CommonPrivateKeyProvider
export const privateKeyProvider = new CommonPrivateKeyProvider({
  config: { chainConfig }
});