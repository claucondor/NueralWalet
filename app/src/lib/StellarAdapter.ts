import { Keypair } from '@stellar/stellar-sdk';
import { saveUserWithKey, recordTransaction } from '../utils/supabase';

// Definir la interfaz KeyPair localmente para evitar dependencias
interface KeyPair {
  publicKey: string;
  secretKey: string;
}

export class StellarAdapter {
  /**
   * Deriva una cuenta Stellar a partir de una clave privada EVM
   */
  static getAccount(evmPrivateKey: string): { stellarAccount: KeyPair, stellarAccountAddress: string } {
    // Usar la clave privada EVM como semilla para generar un Keypair de Stellar
    // En producción podrías usar un algoritmo más sofisticado, como HMAC
    const seed = Buffer.from(evmPrivateKey.slice(2), 'hex');
    
    // Crear un keypair de Stellar a partir de la semilla
    const keypair = Keypair.fromRawEd25519Seed(seed.slice(0, 32));
    
    const stellarAccount: KeyPair = {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret()
    };
    
    return {
      stellarAccount,
      stellarAccountAddress: stellarAccount.publicKey
    };
  }

  /**
   * Guarda las claves del usuario (tanto EVM como Stellar) en Supabase
   */
  static async saveUserWithKeys(
    email: string,
    evmPrivateKey: string, 
    stellarKeyPair: KeyPair
  ): Promise<boolean> {
    if (!email || !evmPrivateKey || !stellarKeyPair) {
      console.error('Faltan datos necesarios para guardar las claves');
      return false;
    }

    try {
      // Dividir las claves (mitad servidor, mitad cliente)
      const evmKeyHalfLength = Math.floor(evmPrivateKey.length / 2);
      const evmServerHalf = evmPrivateKey.substring(0, evmKeyHalfLength);
      
      const stellarSecretKey = stellarKeyPair.secretKey;
      const stellarKeyHalfLength = Math.floor(stellarSecretKey.length / 2);
      const stellarServerHalf = stellarSecretKey.substring(0, stellarKeyHalfLength);
      
      // Guardar en Supabase las mitades del servidor
      const success = await saveUserWithKey(
        email, 
        stellarKeyPair.publicKey, 
        {
          evmKeyHalf: evmServerHalf,
          stellarKeyHalf: stellarServerHalf
        }
      );
      
      return success;
    } catch (error) {
      console.error('Error al guardar las claves en Supabase:', error);
      return false;
    }
  }

  /**
   * Obtiene el balance de una cuenta Stellar
   */
  static async getBalance(stellarAddress: string): Promise<number> {
    try {
      // En implementación real, consultar a la API de Horizon
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${stellarAddress}`);
      
      if (!response.ok) {
        // Si la cuenta no existe en la red, devolvemos 0
        if (response.status === 404) {
          return 0;
        }
        throw new Error(`Error al obtener el balance: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Buscar el balance de XLM (activo nativo)
      const xlmBalance = data.balances.find((balance: any) => balance.asset_type === 'native');
      return xlmBalance ? parseFloat(xlmBalance.balance) : 0;
    } catch (error) {
      console.error('Error al obtener el balance:', error);
      return 0;
    }
  }

  /**
   * Solicita fondos del faucet para una cuenta nueva en testnet
   */
  static async requestAirdrop(stellarAddress: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(stellarAddress)}`
      );
      
      if (!response.ok) {
        throw new Error(`Error al solicitar fondos: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error al solicitar fondos del faucet:', error);
      return false;
    }
  }

  /**
   * Registra una transacción en la base de datos
   */
  static async recordTransaction(
    fromAddress: string,
    toAddress: string,
    amount: number,
    assetType: string,
    txHash: string,
    memo?: string,
    assetCode?: string,
    assetIssuer?: string
  ): Promise<boolean> {
    return recordTransaction(
      fromAddress,
      toAddress,
      amount,
      assetType,
      txHash,
      memo,
      assetCode,
      assetIssuer
    );
  }
} 