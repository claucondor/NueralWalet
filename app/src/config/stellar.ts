// Importar variables de entorno para Stellar
const STELLAR_HORIZON_URL = import.meta.env.VITE_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const STELLAR_NETWORK = import.meta.env.VITE_STELLAR_NETWORK || 'TESTNET';
const STELLAR_EXPLORER_URL = import.meta.env.VITE_STELLAR_EXPLORER_URL || 'https://stellar.expert/explorer/testnet';

// Configuración de red de Stellar para testnet
export const stellarConfig = {
  horizonUrl: STELLAR_HORIZON_URL,
  network: STELLAR_NETWORK,
  explorerUrl: STELLAR_EXPLORER_URL,
  networkPassphrase: STELLAR_NETWORK === 'TESTNET' ? 'Test SDF Network ; September 2015' : 'Public Global Stellar Network ; September 2015'
};

// Otras configuraciones relacionadas con Stellar
export const stellarServiceConfig = {
  // Timeouts, reintentos, etc.
  timeout: 10000, // 10 segundos
  maxRetries: 3
};

// Constantes para la integración con Web3Auth
export const stellarWeb3AuthConfig = {
  chainNamespace: 'other',
  chainId: 'stellar:1', // Valor genérico para Stellar
  rpcTarget: STELLAR_HORIZON_URL,
  displayName: 'Stellar Testnet',
  blockExplorerUrl: STELLAR_EXPLORER_URL,
  ticker: 'XLM',
  tickerName: 'Stellar Lumens'
}; 