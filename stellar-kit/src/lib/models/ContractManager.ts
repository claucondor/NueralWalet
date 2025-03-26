import * as fs from 'fs';
import * as path from 'path';
import { TokenContract } from './TokenContract';
import { TokenContractInfo } from '../interfaces/token.interface';
import { NetworkProvider } from '../interfaces/network.interface';

/**
 * Clase para gestionar contratos de token en una wallet
 */
export class ContractManager {
  private contracts: Map<string, TokenContract>;
  private contractsInfoPath: string;
  private networkProvider?: NetworkProvider;

  /**
   * Constructor de la clase ContractManager
   * @param contractsInfoPath Ruta al directorio donde se almacena la información de los contratos
   * @param networkProvider Proveedor de red personalizado (opcional)
   */
  constructor(contractsInfoPath?: string, networkProvider?: NetworkProvider) {
    this.contracts = new Map<string, TokenContract>();
    this.networkProvider = networkProvider;
    
    // Si no se proporciona una ruta, usar una predeterminada
    this.contractsInfoPath = contractsInfoPath || path.resolve(process.cwd(), 'contracts_info');
    
    // Crear el directorio si no existe
    if (!fs.existsSync(this.contractsInfoPath)) {
      try {
        fs.mkdirSync(this.contractsInfoPath, { recursive: true });
      } catch (error) {
        console.error('Error al crear directorio para información de contratos:', error);
      }
    }
  }

  /**
   * Añade un contrato por su ID
   * @param contractId ID del contrato en la red Soroban
   * @param network Red en la que se encuentra el contrato
   * @param sourceAccount Cuenta origen para las operaciones de lectura
   * @returns El contrato añadido
   */
  addContract(contractId: string, network: 'testnet' | 'mainnet' = 'testnet', sourceAccount?: string): TokenContract {
    const contract = new TokenContract(contractId, network, sourceAccount, this.networkProvider);
    this.contracts.set(contractId, contract);
    return contract;
  }

  /**
   * Obtiene un contrato por su ID
   * @param contractId ID del contrato
   * @returns El contrato solicitado o undefined si no existe
   */
  getContract(contractId: string): TokenContract | undefined {
    return this.contracts.get(contractId);
  }

  /**
   * Elimina un contrato por su ID
   * @param contractId ID del contrato a eliminar
   * @returns true si se eliminó, false si no existía
   */
  removeContract(contractId: string): boolean {
    return this.contracts.delete(contractId);
  }

  /**
   * Carga un contrato desde un archivo de información
   * @param filePath Ruta al archivo de información del contrato
   * @returns El contrato cargado
   */
  loadContractFromFile(filePath: string): TokenContract {
    const contract = TokenContract.fromDeploymentFile(filePath, this.networkProvider);
    this.contracts.set(contract.contractId, contract);
    return contract;
  }

  /**
   * Obtiene información de todos los contratos cargados
   * @returns Lista de información de los contratos
   */
  async getAllContractsInfo(): Promise<TokenContractInfo[]> {
    const infoPromises = Array.from(this.contracts.values()).map(contract => 
      contract.getContractInfo()
    );
    
    return Promise.all(infoPromises);
  }

  /**
   * Guarda la información de un contrato en un archivo
   * @param contractId ID del contrato
   * @param fileName Nombre del archivo (opcional)
   * @returns Ruta al archivo guardado
   */
  async saveContractInfo(contractId: string, fileName?: string): Promise<string> {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      throw new Error(`No se encontró el contrato con ID: ${contractId}`);
    }
    
    const contractInfo = await contract.getContractInfo();
    const saveFileName = fileName || `token_contract_${contractId}.json`;
    const filePath = path.join(this.contractsInfoPath, saveFileName);
    
    fs.writeFileSync(filePath, JSON.stringify(contractInfo, null, 2));
    return filePath;
  }

  /**
   * Carga todos los contratos desde archivos en el directorio de contratos
   * @returns Número de contratos cargados
   */
  loadAllContractsFromDirectory(): number {
    let loadedCount = 0;
    
    try {
      const files = fs.readdirSync(this.contractsInfoPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.contractsInfoPath, file);
            const contract = this.loadContractFromFile(filePath);
            loadedCount++;
          } catch (error) {
            console.error(`Error al cargar contrato desde ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error al leer directorio de contratos:', error);
    }
    
    return loadedCount;
  }

  /**
   * Carga el contrato desde un archivo de despliegue de Soroban
   * @param deploymentFilePath Ruta al archivo de despliegue
   * @param sourceAccount Cuenta origen para las operaciones de lectura (opcional)
   * @returns El contrato cargado
   */
  loadFromDeploymentInfo(deploymentFilePath: string, sourceAccount?: string): TokenContract {
    try {
      const deploymentData = JSON.parse(fs.readFileSync(deploymentFilePath, 'utf8'));
      
      if (!deploymentData.contractId) {
        throw new Error('El archivo de despliegue no contiene un ID de contrato válido');
      }
      
      // Si el archivo contiene información del admin, usamos esa cuenta como source-account
      // a menos que se haya proporcionado explícitamente otra cuenta
      const adminPublicKey = deploymentData.admin && deploymentData.admin.publicKey;
      const userSourceAccount = sourceAccount || adminPublicKey;
      
      const networkType = deploymentData.network === 'testnet' ? 'testnet' : 'mainnet';
      
      const contract = this.addContract(
        deploymentData.contractId, 
        networkType,
        userSourceAccount
      );
      
      // Guardar una copia de la información del contrato en nuestro formato
      const saveFileName = `token_contract_${deploymentData.contractId}.json`;
      const saveFilePath = path.join(this.contractsInfoPath, saveFileName);
      
      // No necesitamos esperar a que se complete getContractInfo
      contract.getContractInfo().then(contractInfo => {
        fs.writeFileSync(saveFilePath, JSON.stringify({
          ...contractInfo,
          deploymentInfo: {
            deploymentDate: deploymentData.deploymentDate,
            admin: {
              publicKey: deploymentData.admin.publicKey,
              name: deploymentData.admin.name
            },
            initialSupply: deploymentData.token.initialSupply
          }
        }, null, 2));
      });
      
      return contract;
    } catch (error) {
      console.error('Error al cargar desde archivo de despliegue:', error);
      throw error;
    }
  }
} 