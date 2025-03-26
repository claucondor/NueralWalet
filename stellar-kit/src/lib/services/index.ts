// Este archivo exportará todos los servicios
// En una implementación completa, aquí se exportarían servicios desde otros archivos

// Servicio para interactuar con la red Stellar
export class NetworkService {
  private isTestnet: boolean;
  
  constructor(isTestnet: boolean = true) {
    this.isTestnet = isTestnet;
  }
  
  // Método para obtener la URL del servidor Horizon basada en el entorno
  getHorizonUrl(): string {
    return this.isTestnet 
      ? 'https://horizon-testnet.stellar.org' 
      : 'https://horizon.stellar.org';
  }
  
  // Método para obtener la URL del explorador basada en el entorno
  getExplorerUrl(): string {
    return this.isTestnet
      ? 'https://stellar.expert/explorer/testnet'
      : 'https://stellar.expert/explorer/public';
  }
}

// Servicio para gestionar cuentas Stellar
export class AccountService {
  private networkService: NetworkService;
  
  constructor(isTestnet: boolean = true) {
    this.networkService = new NetworkService(isTestnet);
  }
  
  // Método para verificar si una cuenta existe
  async accountExists(publicKey: string): Promise<boolean> {
    // Implementación básica
    return publicKey.startsWith('G');
  }
  
  // Método para obtener el balance de una cuenta
  async getBalance(publicKey: string): Promise<number> {
    // Implementación básica
    return 100.0;
  }
} 