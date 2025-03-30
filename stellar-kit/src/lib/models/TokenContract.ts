import * as fs from 'fs';
import * as path from 'path';
import { TokenMetadata, TokenBalance, TokenContractInfo } from '../interfaces/token.interface';
import { NetworkProvider, NetworkType } from '../interfaces/network.interface';
import { StellarNetworkService } from '../services/network.service';

/**
 * Clase para interactuar con contratos de token SEP-41 en Soroban
 */
export class TokenContract {
  private _contractId: string;
  private _sourceAccount: string;
  private networkProvider: NetworkProvider;

  /**
   * Constructor para la clase TokenContract
   * @param contractId ID del contrato en la red Soroban
   * @param networkType Red en la que se encuentra el contrato ('testnet' o 'mainnet')
   * @param sourceAccount Cuenta de origen para las operaciones de lectura (opcional)
   * @param networkProvider Proveedor de red personalizado (opcional)
   */
  constructor(
    contractId: string, 
    networkType: NetworkType = 'testnet', 
    sourceAccount?: string,
    networkProvider?: NetworkProvider
  ) {
    this._contractId = contractId;
    // Si no se proporciona una cuenta de origen, usamos una cuenta pública de prueba
    this._sourceAccount = sourceAccount || 'GBFYKQDLUVWBVMIZQFMGFP4VGTVYWRQBVG43KJGEYEXHXN26GFKJOUKZ';
    // Si no se proporciona un proveedor de red, creamos uno nuevo
    this.networkProvider = networkProvider || new StellarNetworkService(networkType);
  }

  /**
   * Obtiene el ID del contrato
   */
  get contractId(): string {
    return this._contractId;
  }
  
  /**
   * Obtiene la red en la que está desplegado el contrato
   */
  get network(): NetworkType {
    return this.networkProvider.getNetworkConfig().isTestnet ? 'testnet' : 'mainnet';
  }
  
  /**
   * Obtiene la cuenta de origen utilizada para las operaciones de lectura
   */
  get sourceAccount(): string {
    return this._sourceAccount;
  }
  
  /**
   * Establece una nueva cuenta de origen para las operaciones de lectura
   */
  set sourceAccount(account: string) {
    this._sourceAccount = account;
  }

  /**
   * Prueba un método genérico del contrato para ver si está disponible
   * @param methodName Nombre del método a probar
   * @returns true si el método existe y puede ser llamado
   */
  async testMethod(methodName: string): Promise<boolean> {
    try {
      const config = this.networkProvider.getNetworkConfig();
      const command = `stellar contract invoke \
        --id ${this._contractId} \
        --source ${this._sourceAccount} \
        --rpc-url ${config.rpcUrl} \
        --network-passphrase "${config.networkPassphrase}" \
        -- \
        ${methodName}`;
      
      await this.networkProvider.executeContractCommand(command);
      return true;
    } catch (error) {
      // Verificar si el error indica que el método no existe
      const errorStr = String(error);
      if (errorStr.includes(`unrecognized subcommand '${methodName}'`)) {
        return false;
      }
      
      // Si el error es por parámetros faltantes, entonces el método existe
      if (errorStr.includes('required arguments')) {
        return true;
      }
      
      return false;
    }
  }

  /**
   * Devuelve los métodos disponibles en el contrato StellarToken según su implementación conocida
   * @returns Objeto con los métodos disponibles en el contrato
   */
  async getAvailableMethods(): Promise<Record<string, string>> {
    // En lugar de detectar dinámicamente, usamos los métodos que sabemos que están en el contrato
    // según la implementación en soroban_contract/src/lib.rs
    
    // Estos son los métodos que realmente existen en nuestro contrato SEP-41
    return {
      // Métodos token::Interface (implementados en el segundo #[contractimpl])
      'name': 'name',
      'symbol': 'symbol',
      'decimals': 'decimals',
      'balance': 'balance',
      'allowance': 'allowance',
      'approve': 'approve',
      'transfer': 'transfer',
      'transfer_from': 'transfer_from',
      'burn': 'burn',
      'burn_from': 'burn_from',
      
      // Métodos específicos de StellarToken (implementados en el primer #[contractimpl])
      'mint': 'mint',
      'set_admin': 'set_admin'
    };
  }

  /**
   * Obtiene los metadatos básicos del token (nombre, símbolo, decimales)
   * @returns Objeto con los metadatos del token
   */
  async getTokenMetadata(): Promise<TokenMetadata> {
    try {
      const config = this.networkProvider.getNetworkConfig();
      
      // Obtener el nombre del token
      let name = '';
      try {
        const nameCommand = `stellar contract invoke \
          --id ${this._contractId} \
          --source ${this._sourceAccount} \
          --rpc-url ${config.rpcUrl} \
          --network-passphrase "${config.networkPassphrase}" \
          -- \
          name`;
        
        console.log(`Ejecutando comando para obtener nombre: ${nameCommand}`);
        name = await this.networkProvider.executeContractCommand(nameCommand);
        console.log(`Nombre del token obtenido: ${name}`);
        
        // Limpiar las comillas si existen
        name = this.cleanQuotedString(name);
      } catch (error) {
        console.error('Error al obtener el nombre del token:', error);
        // Usar un nombre más descriptivo basado en el ID del contrato
        const shortId = this._contractId.substring(0, 6);
        name = `Token ${shortId}`;
      }
      
      // Obtener el símbolo del token
      let symbol = '';
      try {
        const symbolCommand = `stellar contract invoke \
          --id ${this._contractId} \
          --source ${this._sourceAccount} \
          --rpc-url ${config.rpcUrl} \
          --network-passphrase "${config.networkPassphrase}" \
          -- \
          symbol`;
        
        console.log(`Ejecutando comando para obtener símbolo: ${symbolCommand}`);
        symbol = await this.networkProvider.executeContractCommand(symbolCommand);
        console.log(`Símbolo del token obtenido: ${symbol}`);
        
        // Limpiar las comillas si existen
        symbol = this.cleanQuotedString(symbol);
      } catch (error) {
        console.error('Error al obtener el símbolo del token:', error);
        // Usar un símbolo basado en el ID del contrato
        symbol = this._contractId.substring(0, 3).toUpperCase();
      }
      
      // Obtener los decimales del token
      let decimals = 7; // Valor por defecto para tokens Stellar
      try {
        const decimalsCommand = `stellar contract invoke \
          --id ${this._contractId} \
          --source ${this._sourceAccount} \
          --rpc-url ${config.rpcUrl} \
          --network-passphrase "${config.networkPassphrase}" \
          -- \
          decimals`;
        
        console.log(`Ejecutando comando para obtener decimales: ${decimalsCommand}`);
        const decimalsStr = await this.networkProvider.executeContractCommand(decimalsCommand);
        console.log(`Decimales del token obtenidos: ${decimalsStr}`);
        decimals = parseInt(decimalsStr);
      } catch (error) {
        console.error('Error al obtener los decimales del token:', error);
      }
      
      return {
        name,
        symbol,
        decimals
      };
    } catch (error) {
      console.error('Error al obtener metadatos del token:', error);
      throw error;
    }
  }

  /**
   * Limpia un string que puede contener comillas
   * @param value Valor que puede tener comillas
   * @returns Valor sin comillas
   */
  private cleanQuotedString(value: string): string {
    if (!value) return '';
    
    // Eliminar comillas al principio y al final
    return value.replace(/^"(.+)"$/, '$1');
  }

  /**
   * Obtiene el balance de un token para una dirección
   * @param address Dirección para la cual obtener el balance
   * @returns Balance del token
   */
  async getBalance(address: string): Promise<TokenBalance> {
    try {
      const config = this.networkProvider.getNetworkConfig();
      const command = `stellar contract invoke \
        --id ${this._contractId} \
        --source ${this._sourceAccount} \
        --rpc-url ${config.rpcUrl} \
        --network-passphrase "${config.networkPassphrase}" \
        -- \
        balance \
        --id ${address}`;
      
      const balance = await this.networkProvider.executeContractCommand(command);
      
      // Obtener los decimales para formatear el balance
      const metadata = await this.getTokenMetadata();
      const formattedBalance = this.formatBalance(balance, metadata.decimals);
      
      return {
        address,
        balance,
        formattedBalance
      };
    } catch (error) {
      console.error(`Error al obtener balance para ${address}:`, error);
      return {
        address,
        balance: '0',
        formattedBalance: '0'
      };
    }
  }

  /**
   * Formatea un balance en bruto según los decimales del token
   * @param balance Balance en bruto (como string)
   * @param decimals Decimales del token
   * @returns Balance formateado como string
   */
  private formatBalance(balance: string, decimals: number): string {
    try {
      // Si el balance está vacío o es cero, devolver "0"
      if (!balance || balance === '0') {
        return '0';
      }
      
      // Convertir el string a número
      const balanceNum = Number(balance);
      
      // Si no es un número válido, devolver el balance original
      if (isNaN(balanceNum)) {
        return balance;
      }
      
      // Aplicar factor de decimales
      const formattedNum = balanceNum / Math.pow(10, decimals);
      
      // Convertir a string con el número apropiado de decimales
      let formattedStr = formattedNum.toString();
      
      // Para números grandes, utilizar notación fija hasta 8 decimales significativos
      if (formattedNum > 1) {
        formattedStr = formattedNum.toFixed(Math.min(8, decimals));
        // Eliminar ceros finales y punto decimal si no hay decimales
        formattedStr = formattedStr.replace(/\.?0+$/, '');
      }
      
      return formattedStr;
    } catch (error) {
      console.error('Error al formatear balance:', error);
      return balance; // Devolver el balance original en caso de error
    }
  }

  /**
   * Obtiene información completa del contrato
   * @returns Información del contrato
   */
  async getContractInfo(): Promise<TokenContractInfo> {
    const metadata = await this.getTokenMetadata();
    
    return {
      contractId: this._contractId,
      network: this.network,
      metadata
    };
  }

  /**
   * Crea una instancia de TokenContract a partir de un archivo de despliegue
   * @param deploymentFilePath Ruta al archivo de despliegue
   * @param networkProvider Proveedor de red personalizado (opcional)
   * @returns Instancia de TokenContract
   */
  static fromDeploymentFile(deploymentFilePath: string, networkProvider?: NetworkProvider): TokenContract {
    const deploymentData = JSON.parse(fs.readFileSync(deploymentFilePath, 'utf8'));
    
    if (!deploymentData.contractId) {
      throw new Error('El archivo de despliegue no contiene un ID de contrato válido');
    }
    
    const networkType: NetworkType = deploymentData.network === 'testnet' ? 'testnet' : 'mainnet';
    
    // Si el archivo contiene información del admin, usamos esa cuenta como source-account
    const adminPublicKey = deploymentData.admin && deploymentData.admin.publicKey;
    
    return new TokenContract(
      deploymentData.contractId, 
      networkType,
      adminPublicKey,
      networkProvider
    );
  }

  /**
   * Genera el comando para transferir tokens
   */
  getTransferCommand(fromSecret: string, toAddress: string, amount: string): string {
    const config = this.networkProvider.getNetworkConfig();
    return `stellar contract invoke \
      --id ${this._contractId} \
      --source ${fromSecret} \
      --rpc-url ${config.rpcUrl} \
      --network-passphrase "${config.networkPassphrase}" \
      -- \
      transfer \
      --from $(stellar address --secret ${fromSecret}) \
      --to ${toAddress} \
      --amount ${amount}`;
  }

  /**
   * Transfiere tokens de una dirección a otra
   * @param secretKey Clave secreta de la cuenta que envía
   * @param to Dirección de destino
   * @param amount Cantidad a transferir
   * @returns Hash de la transacción
   */
  async transfer(secretKey: string, to: string, amount: string): Promise<{ hash: string }> {
    const command = this.getTransferCommand(secretKey, to, amount);
    
    try {
      const result = await this.networkProvider.executeContractCommand(command, true);
      
      // Extraer el hash de la transacción del resultado
      const hashMatch = result.match(/Transaction hash: ([a-zA-Z0-9]+)/);
      if (hashMatch && hashMatch[1]) {
        return { hash: hashMatch[1] };
      }
      
      return { hash: result }; // Si no podemos extraer el hash, devolvemos el resultado completo
    } catch (error) {
      console.error('Error al transferir tokens:', error);
      throw error;
    }
  }

  /**
   * Aprueba tokens para ser gastados por otra cuenta
   * @param secretKey Clave secreta del propietario
   * @param spender Dirección que podrá gastar los tokens
   * @param amount Cantidad aprobada
   * @param expirationLedger Número de ledger en el que expira la aprobación
   * @returns Hash de la transacción
   */
  async approve(secretKey: string, spender: string, amount: string, expirationLedger: number): Promise<{ hash: string }> {
    const config = this.networkProvider.getNetworkConfig();
    const command = `stellar contract invoke \
      --id ${this._contractId} \
      --source ${secretKey} \
      --rpc-url ${config.rpcUrl} \
      --network-passphrase "${config.networkPassphrase}" \
      -- \
      approve \
      --from $(stellar address --secret ${secretKey}) \
      --spender ${spender} \
      --amount ${amount} \
      --expiration_ledger ${expirationLedger}`;
    
    try {
      const result = await this.networkProvider.executeContractCommand(command, true);
      
      // Extraer el hash de la transacción del resultado
      const hashMatch = result.match(/Transaction hash: ([a-zA-Z0-9]+)/);
      if (hashMatch && hashMatch[1]) {
        return { hash: hashMatch[1] };
      }
      
      return { hash: result };
    } catch (error) {
      console.error('Error al aprobar tokens:', error);
      throw error;
    }
  }

  /**
   * Obtiene la cantidad de tokens que una cuenta puede gastar en nombre de otra
   * @param from Propietario de los tokens
   * @param spender Cuenta autorizada a gastar
   * @returns Cantidad aprobada
   */
  async getAllowance(from: string, spender: string): Promise<string> {
    const config = this.networkProvider.getNetworkConfig();
    const command = `stellar contract invoke \
      --id ${this._contractId} \
      --source ${this._sourceAccount} \
      --rpc-url ${config.rpcUrl} \
      --network-passphrase "${config.networkPassphrase}" \
      -- \
      allowance \
      --from ${from} \
      --spender ${spender}`;
    
    try {
      return await this.networkProvider.executeContractCommand(command);
    } catch (error) {
      console.error('Error al obtener allowance:', error);
      throw error;
    }
  }

  /**
   * Acuña nuevos tokens (solo puede ser ejecutado por el admin)
   * @param adminSecretKey Clave secreta del administrador
   * @param to Dirección que recibirá los tokens
   * @param amount Cantidad a acuñar
   * @returns Hash de la transacción
   */
  async mint(adminSecretKey: string, to: string, amount: string): Promise<{ hash: string }> {
    const config = this.networkProvider.getNetworkConfig();
    const command = `stellar contract invoke \
      --id ${this._contractId} \
      --source ${adminSecretKey} \
      --rpc-url ${config.rpcUrl} \
      --network-passphrase "${config.networkPassphrase}" \
      -- \
      mint \
      --to ${to} \
      --amount ${amount}`;
    
    try {
      const result = await this.networkProvider.executeContractCommand(command, true);
      
      // Extraer el hash de la transacción del resultado
      const hashMatch = result.match(/Transaction hash: ([a-zA-Z0-9]+)/);
      if (hashMatch && hashMatch[1]) {
        return { hash: hashMatch[1] };
      }
      
      return { hash: result };
    } catch (error) {
      console.error('Error al acuñar tokens:', error);
      throw error;
    }
  }

  /**
   * Quema tokens
   * @param secretKey Clave secreta del propietario de los tokens
   * @param amount Cantidad a quemar
   * @returns Hash de la transacción
   */
  async burn(secretKey: string, amount: string): Promise<{ hash: string }> {
    const config = this.networkProvider.getNetworkConfig();
    const command = `stellar contract invoke \
      --id ${this._contractId} \
      --source ${secretKey} \
      --rpc-url ${config.rpcUrl} \
      --network-passphrase "${config.networkPassphrase}" \
      -- \
      burn \
      --from $(stellar address --secret ${secretKey}) \
      --amount ${amount}`;
    
    try {
      const result = await this.networkProvider.executeContractCommand(command, true);
      
      // Extraer el hash de la transacción del resultado
      const hashMatch = result.match(/Transaction hash: ([a-zA-Z0-9]+)/);
      if (hashMatch && hashMatch[1]) {
        return { hash: hashMatch[1] };
      }
      
      return { hash: result };
    } catch (error) {
      console.error('Error al quemar tokens:', error);
      throw error;
    }
  }

  /**
   * Cambia el administrador del token
   * @param adminSecretKey Clave secreta del administrador actual
   * @param newAdmin Dirección del nuevo administrador
   * @returns Hash de la transacción
   */
  async setAdmin(adminSecretKey: string, newAdmin: string): Promise<{ hash: string }> {
    const config = this.networkProvider.getNetworkConfig();
    const command = `stellar contract invoke \
      --id ${this._contractId} \
      --source ${adminSecretKey} \
      --rpc-url ${config.rpcUrl} \
      --network-passphrase "${config.networkPassphrase}" \
      -- \
      set_admin \
      --new_admin ${newAdmin}`;
    
    try {
      const result = await this.networkProvider.executeContractCommand(command, true);
      
      // Extraer el hash de la transacción del resultado
      const hashMatch = result.match(/Transaction hash: ([a-zA-Z0-9]+)/);
      if (hashMatch && hashMatch[1]) {
        return { hash: hashMatch[1] };
      }
      
      return { hash: result };
    } catch (error) {
      console.error('Error al cambiar administrador:', error);
      throw error;
    }
  }
} 