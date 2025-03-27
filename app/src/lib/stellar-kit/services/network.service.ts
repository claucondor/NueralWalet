import * as StellarSdk from '@stellar/stellar-sdk';
import { NetworkConfig, NetworkProvider, NetworkType } from '../interfaces/network.interface';

/**
 * Servicio que proporciona acceso a la red Stellar/Soroban
 */
export class StellarNetworkService implements NetworkProvider {
  private config: NetworkConfig;
  private server: StellarSdk.Horizon.Server;

  /**
   * Constructor
   * @param networkType Tipo de red (testnet o mainnet)
   */
  constructor(networkType: NetworkType = 'testnet') {
    const isTestnet = networkType === 'testnet';
    
    this.config = {
      rpcUrl: isTestnet ? 'https://soroban-testnet.stellar.org' : 'https://soroban.stellar.org',
      networkPassphrase: isTestnet ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC,
      explorerBaseUrl: isTestnet ? 'https://testnet.steexp.com' : 'https://steexp.com',
      isTestnet
    };
    
    this.server = new StellarSdk.Horizon.Server(
      isTestnet ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org'
    );
  }

  /**
   * Obtiene el servidor Horizon
   */
  getServer(): StellarSdk.Horizon.Server {
    return this.server;
  }

  /**
   * Obtiene la configuración de red
   */
  getNetworkConfig(): NetworkConfig {
    return { ...this.config };
  }

  /**
   * Ejecuta un comando de contrato utilizando API REST o navegador
   * @param command Comando a ejecutar
   * @param forceExecution Si es true, agrega parámetros adicionales
   * @returns Resultado del comando
   * 
   * Nota: Esta implementación es compatible con el navegador y no usa execSync
   */
  async executeContractCommand(command: string, forceExecution: boolean = false): Promise<string> {
    try {
      console.log('Comando solicitado:', command, 'Forzar ejecución:', forceExecution);
      
      // En el entorno del navegador, no podemos ejecutar comandos CLI directamente
      // Aquí deberíamos implementar una alternativa compatible o usar llamadas API
      
      // Implementación simulada para el navegador
      return `Simulación de comando en navegador: "${command}" ${forceExecution ? '(ejecución forzada)' : ''}`;
    } catch (error) {
      console.error('Error simulando comando Stellar:', error);
      throw error;
    }
  }
} 