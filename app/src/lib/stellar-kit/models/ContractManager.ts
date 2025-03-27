import { TokenContract } from './TokenContract';
import { TokenContractInfo } from '../interfaces/token.interface';
import { NetworkProvider } from '../interfaces/network.interface';

/**
 * Clase para gestionar contratos de token en una wallet (versión navegador)
 */
export class ContractManager {
  private contracts: Map<string, TokenContract>;
  private storageKey: string;
  private networkProvider?: NetworkProvider;

  /**
   * Constructor de la clase ContractManager
   * @param storageKey Clave para almacenar en localStorage (opcional)
   * @param networkProvider Proveedor de red personalizado (opcional)
   */
  constructor(storageKey?: string, networkProvider?: NetworkProvider) {
    this.contracts = new Map<string, TokenContract>();
    this.networkProvider = networkProvider;
    
    // Si no se proporciona una clave, usar una predeterminada
    this.storageKey = storageKey || 'stellar-token-contracts';
    
    // Intentar cargar contratos desde localStorage
    this.loadContractsFromStorage();
  }

  /**
   * Carga contratos desde localStorage
   */
  private loadContractsFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && localStorage) {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          const contractsData = JSON.parse(data);
          for (const contractInfo of contractsData) {
            this.addContract(
              contractInfo.contractId,
              contractInfo.network || 'testnet',
              contractInfo.sourceAccount
            );
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar contratos desde localStorage:', error);
    }
  }

  /**
   * Guarda los contratos en localStorage
   */
  private saveContractsToStorage(): void {
    try {
      if (typeof window !== 'undefined' && localStorage) {
        const contractsData = Array.from(this.contracts.values()).map(contract => ({
          contractId: contract.contractId,
          network: contract.getNetwork(),
          sourceAccount: contract.getSourceAccount()
        }));
        localStorage.setItem(this.storageKey, JSON.stringify(contractsData));
      }
    } catch (error) {
      console.error('Error al guardar contratos en localStorage:', error);
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
    this.saveContractsToStorage();
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
    const result = this.contracts.delete(contractId);
    if (result) {
      this.saveContractsToStorage();
    }
    return result;
  }

  /**
   * Método de compatibilidad - No disponible en navegador
   * @param filePath Ruta al archivo (no funciona en navegador)
   */
  loadContractFromFile(filePath: string): TokenContract {
    console.warn('loadContractFromFile no está disponible en el navegador');
    throw new Error('loadContractFromFile no es compatible con el entorno del navegador');
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
   * Guarda la información de un contrato en localStorage
   * @param contractId ID del contrato
   * @returns true si se guardó correctamente
   */
  async saveContractInfo(contractId: string): Promise<boolean> {
    try {
      this.saveContractsToStorage();
      return true;
    } catch (error) {
      console.error('Error al guardar información del contrato:', error);
      return false;
    }
  }

  /**
   * Método de compatibilidad - No disponible en navegador
   */
  loadAllContractsFromDirectory(): number {
    console.warn('loadAllContractsFromDirectory no está disponible en el navegador');
    return 0;
  }

  /**
   * Método de compatibilidad - No disponible en navegador
   * @param deploymentFilePath Ruta al archivo (no funciona en navegador)
   */
  loadFromDeploymentInfo(deploymentFilePath: string): TokenContract {
    console.warn('loadFromDeploymentInfo no está disponible en el navegador');
    throw new Error('loadFromDeploymentInfo no es compatible con el entorno del navegador');
  }
} 