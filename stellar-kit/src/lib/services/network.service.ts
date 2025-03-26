import * as StellarSdk from '@stellar/stellar-sdk';
import { execSync } from 'child_process';
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
   * Ejecuta un comando de contrato utilizando la CLI de Stellar
   * @param command Comando a ejecutar
   * @param forceExecution Si es true, agrega --send=yes para forzar la ejecución
   * @returns Resultado del comando
   */
  async executeContractCommand(command: string, forceExecution: boolean = false): Promise<string> {
    try {
      // Si forceExecution es true, agregar --send=yes al comando para evitar la simulación
      const finalCommand = forceExecution ? 
        command.replace(/contract invoke/, 'contract invoke --send=yes') : 
        command;
        
      return execSync(finalCommand, { encoding: 'utf8' }).trim();
    } catch (error) {
      console.error('Error ejecutando comando Stellar CLI:', error);
      throw error;
    }
  }
} 