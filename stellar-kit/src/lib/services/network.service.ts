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
      // Usar endpoints públicos que no requieren API key
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
      // Reemplazar 'soroban' con 'stellar' en el comando si es necesario
      let finalCommand = command.replace(/^soroban /, 'stellar ');
      
      // Para compatibilidad entre diferentes versiones de CLI
      // En versiones 22+, se usa --source, en versiones anteriores --source-account
      const needsSourceFix = finalCommand.includes('--source-account');
      if (needsSourceFix) {
        // Intentar actualizar para usar la sintaxis más reciente
        finalCommand = finalCommand.replace(/--source-account\s+([A-Za-z0-9]+)/, '--source $1');
      }
      
      // Si forceExecution es true, agregar --send=yes al comando para evitar la simulación
      if (forceExecution) {
        finalCommand = finalCommand.replace(/contract invoke/, 'contract invoke --send=yes');
      }
      
      console.log(`Ejecutando comando: ${finalCommand}`);
      try {
        const result = execSync(finalCommand, { encoding: 'utf8' }).trim();
        console.log(`Resultado del comando: ${result}`);
        return this.cleanOutput(result);
      } catch (execError: any) {
        console.error(`Error ejecución de comando (${finalCommand}):`, execError.message);
        
        // Mostrar stderr y stdout para diagnóstico
        if (execError.stderr) console.error(`stderr: ${execError.stderr}`);
        if (execError.stdout) console.error(`stdout: ${execError.stdout}`);
        
        // Verificar si es un error de comando no encontrado o biblioteca faltante
        if (execError.message && (
            execError.message.includes('command not found') || 
            execError.message.includes('error while loading shared libraries') || 
            execError.message.includes('No such file or directory')
        )) {
          console.warn('CLI de Stellar no instalada o con problemas de dependencias. Utilizando valores predeterminados.');
          return this.getDefaultValueForCommand(finalCommand);
        }
        
        // Manejar error de dirección inválida
        if (execError.stderr && execError.stderr.includes('Invalid address')) {
          console.log('Error de dirección inválida. Intentando alternativas...');
          
          // Si estamos usando la sintaxis nueva (--source) y falló, intentar con la antigua
          if (finalCommand.includes('--source') && !needsSourceFix) {
            console.log('Reintentando con --source-account en lugar de --source...');
            const altCommand = finalCommand.replace(/--source\s+([A-Za-z0-9]+)/, '--source-account $1');
            
            try {
              const result = execSync(altCommand, { encoding: 'utf8' }).trim();
              console.log('¡Comando alternativo exitoso!');
              return this.cleanOutput(result);
            } catch (e) {
              console.log('El comando alternativo también falló.');
            }
          }
          
          return this.getDefaultValueForCommand(finalCommand);
        }
        
        throw execError;
      }
    } catch (error) {
      console.error('Error ejecutando comando Stellar CLI:', error);
      // En caso de cualquier error, proporcionar un valor predeterminado
      return this.getDefaultValueForCommand(command);
    }
  }
  
  /**
   * Limpia el output para quitar caracteres no deseados como comillas
   * @param output Salida del comando a limpiar
   * @returns Salida limpia
   */
  private cleanOutput(output: string): string {
    if (!output) return '';
    
    // Detectar si es un valor de cadena con comillas
    if (/^".*"$/.test(output.trim())) {
      return output.trim().replace(/^"(.+)"$/, '$1');
    }
    
    return output;
  }
  
  /**
   * Devuelve un valor predeterminado basado en el tipo de comando
   * @param command El comando que se intentó ejecutar
   * @returns Un valor predeterminado adecuado
   */
  private getDefaultValueForCommand(command: string): string {
    // Devolver valores predeterminados basados en el comando
    if (command.includes('name')) {
      const contractId = (command.match(/--id\s+([A-Za-z0-9]+)/) || [])[1] || '';
      const shortId = contractId.substring(0, 6);
      return shortId ? `Token ${shortId}` : 'Token';
    } else if (command.includes('symbol')) {
      const contractId = (command.match(/--id\s+([A-Za-z0-9]+)/) || [])[1] || '';
      return contractId.substring(0, 3).toUpperCase() || 'TKN';
    } else if (command.includes('decimals')) {
      return '7';
    } else if (command.includes('balance')) {
      return '0';
    } else if (command.includes('allowance')) {
      return '0';
    } else if (command.includes('admin')) {
      return '';
    }
    
    // Valor predeterminado general para otros casos
    return '';
  }
} 