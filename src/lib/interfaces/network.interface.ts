/**
 * Interfaces relacionadas con la red Stellar
 */

/**
 * Configuración de red
 */
export interface NetworkConfig {
  rpcUrl: string;
  networkPassphrase: string;
  explorerBaseUrl: string;
  isTestnet: boolean;
}

/**
 * Tipo de red
 */
export type NetworkType = 'testnet' | 'mainnet';

/**
 * Proveedor para interactuar con la red Stellar/Soroban
 */
export interface NetworkProvider {
  /**
   * Obtiene la configuración de la red
   */
  getNetworkConfig(): NetworkConfig;
  
  /**
   * Ejecuta un comando de contrato
   */
  executeContractCommand(command: string, forceExecution?: boolean): Promise<string>;
} 