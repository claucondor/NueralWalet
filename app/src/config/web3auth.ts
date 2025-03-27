import { CHAIN_NAMESPACES, CustomChainConfig } from '@web3auth/base';
import { CommonPrivateKeyProvider } from '@web3auth/base-provider';

// Importar configuración de Stellar
const STELLAR_HORIZON_URL = import.meta.env.VITE_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const STELLAR_NETWORK = import.meta.env.VITE_STELLAR_NETWORK || 'TESTNET';
const STELLAR_EXPLORER_URL = import.meta.env.VITE_STELLAR_EXPLORER_URL || 'https://stellar.expert/explorer/testnet';

// Stellar Testnet chain configuration
export const chainConfig: CustomChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.OTHER,
  chainId: "stellar:testnet", // Un valor más específico para Stellar testnet
  rpcTarget: STELLAR_HORIZON_URL,
  displayName: "Stellar Testnet",
  blockExplorerUrl: STELLAR_EXPLORER_URL,
  ticker: "XLM",
  tickerName: "Stellar Lumens",
};

// Configuración de Web3Auth
export const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || '';
export const web3AuthNetwork = import.meta.env.VITE_WEB3AUTH_NETWORK || 'testnet';
export const verifierName = import.meta.env.VITE_VERIFIER_NAME || "web3auth-stellar-verifier";

// Configurar el privateKeyProvider para Web3Auth usando CommonPrivateKeyProvider
export const privateKeyProvider = new CommonPrivateKeyProvider({
  config: { chainConfig }
});