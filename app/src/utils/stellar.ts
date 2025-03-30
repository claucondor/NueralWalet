import * as StellarSdk from '@stellar/stellar-sdk';
import { stellarConfig } from '../config/stellar';
import { accountService, tokenService, transactionService } from '../services/stellarKitApi';

// Definir interfaz KeyPair
interface KeyPair {
  publicKey: string;
  secretKey: string;
}

// Interfaces para balances de Stellar
interface StellarAssetBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

/**
 * Genera una cuenta Stellar a partir de una clave privada
 * @param privateKey - Clave privada de Web3Auth
 * @returns Cuenta Stellar y dirección
 */
export const getStellarAccount = (privateKey: string): { stellarAccount: KeyPair, stellarAddress: string } => {
  try {
    // Limpiar '0x' si está presente
    const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey.substring(2) : privateKey;
    
    // Crear un keypair derivado
    const seed = Buffer.from(cleanPrivateKey.padEnd(64, '0').slice(0, 64), 'hex');
    const keypair = StellarSdk.Keypair.fromRawEd25519Seed(seed);
    
    const stellarAccount = {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret()
    };
    
    const stellarAddress = keypair.publicKey();
    
    return { stellarAccount, stellarAddress };
  } catch (error) {
    console.error('Error al derivar cuenta Stellar:', error);
    throw error;
  }
};

/**
 * Obtiene el balance de una cuenta Stellar
 * @param accountAddress - Dirección de la cuenta
 * @returns Balance de la cuenta
 */
export const getStellarBalance = async (accountAddress: string): Promise<number> => {
  try {
    const accountInfo = await accountService.getAccountInfo(accountAddress);
    return accountInfo ? parseFloat(accountInfo.balance || '0') : 0;
  } catch (error) {
    console.error("Error obteniendo balance de Stellar:", error);
    return 0;
  }
};

/**
 * Solicita XLM de prueba (solo funciona en testnet)
 * @param accountAddress - Dirección de la cuenta para recibir tokens
 * @returns Estado de la solicitud
 */
export const requestTestnetXLM = async (accountAddress: string): Promise<boolean> => {
  try {
    if (stellarConfig.network !== 'TESTNET') {
      console.error('No se puede solicitar XLM en mainnet');
      return false;
    }
    
    const result = await accountService.fundAccount(accountAddress);
    return result.success;
  } catch (error) {
    console.error("Error solicitando XLM de testnet:", error);
    return false;
  }
};

/**
 * Enviar una transacción en Stellar
 * @param secretKey - Clave secreta del remitente
 * @param recipientAddress - Dirección del destinatario
 * @param amount - Cantidad a enviar
 * @param options - Opciones adicionales como memo, assetCode, assetIssuer
 * @returns Resultado de la transacción
 */
export const sendTransaction = async (
  secretKey: string,
  recipientAddress: string,
  amount: string,
  options?: { 
    memo?: string;
    assetCode?: string;
    assetIssuer?: string;
  }
): Promise<{ success: boolean; hash?: string; error?: string }> => {
  return transactionService.sendPayment(
    secretKey,
    recipientAddress,
    amount,
    options?.memo
  );
};

/**
 * Crear una cuenta Stellar
 * @param sourceSecretKey - Clave secreta de la cuenta que financia
 * @param startingBalance - Balance inicial
 * @returns Nueva cuenta creada
 */
export const createAccount = async (
  sourceSecretKey: string, 
  startingBalance: string = "2"
): Promise<{ success: boolean; publicKey?: string; secretKey?: string; error?: string }> => {
  try {
    // Generar un nuevo keypair localmente
    const newKeypair = StellarSdk.Keypair.random();
    const newAccount = {
      publicKey: newKeypair.publicKey(), 
      secretKey: newKeypair.secret()
    };
    
    const result = await accountService.createAccount(
      sourceSecretKey,
      newAccount.publicKey,
      startingBalance
    );
    
    if (result.success) {
      return {
        success: true,
        publicKey: newAccount.publicKey,
        secretKey: newAccount.secretKey
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error("Error creando cuenta:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Simula comprar XLM con tarjeta de crédito
 * Esto es para fines de demostración - en una app real integrarías con un procesador de pagos
 * @param accountAddress - Dirección de la cuenta para recibir tokens
 * @param amount - Cantidad de XLM a comprar
 * @param paymentMethod - ID del método de pago
 * @returns Estado de éxito y detalles de transacción
 */
export const simulatePurchaseXLM = async (
  accountAddress: string, 
  amount: string,
  paymentMethod: string
) => {
  try {
    // Precio fijo de XLM en USD
    const XLM_PRICE_USD = 0.11;
    
    // Calcular costo total
    const xlmAmount = parseFloat(amount);
    const totalCost = (xlmAmount * XLM_PRICE_USD).toFixed(2);
    
    // Simular retraso en procesamiento de pago
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simular pago exitoso en testnet o mainnet
    let result = false;
    
    if (stellarConfig.network === 'TESTNET') {
      result = await requestTestnetXLM(accountAddress);
    } else {
      // En mainnet, simular transferencia exitosa
      result = true;
    }
    
    if (result) {
      return {
        success: true,
        amount: xlmAmount,
        cost: totalCost,
        currency: 'USD',
        paymentMethod,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error("Error al procesar la transferencia de tokens después del pago");
    }
  } catch (error) {
    console.error("Error simulando compra:", error);
    return { success: false };
  }
};

/**
 * Enviar una transacción a una dirección de correo (se resolverá a una dirección Stellar)
 * @param secretKey - Clave secreta del remitente
 * @param recipientEmail - Correo del destinatario
 * @param amount - Cantidad a enviar
 * @param options - Opciones adicionales
 * @returns Resultado de la transacción
 */
export const sendTransactionByEmail = async (
  secretKey: string,
  recipientEmail: string,
  amount: string,
  options?: {
    memo?: string;
    assetCode?: string;
    assetIssuer?: string;
  }
) => {
  try {
    // Simular la resolución para la demo - simular un retraso
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generar una dirección Stellar ficticia basada en el correo para fines de demostración
    const mockAddress = generateMockAddressFromEmail(recipientEmail);
    
    // Enviar la transacción a la dirección resuelta
    return await sendTransaction(secretKey, mockAddress, amount, options);
  } catch (error) {
    console.error("Error enviando por email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Función auxiliar para generar una dirección Stellar ficticia a partir de un correo
 * SOLO PARA DEMOSTRACIÓN - en una implementación real, se usaría un servicio de federación
 */
function generateMockAddressFromEmail(email: string): string {
  // Generar una dirección basada en el hash del correo
  const emailData = Buffer.from(email);
  const randomPart = Array.from(emailData)
                          .map(byte => byte.toString(16).padStart(2, '0'))
                          .join('')
                          .substring(0, 32);
  
  // Crear una dirección de demostración que parece una dirección Stellar real
  // G es el prefijo estándar para claves públicas Stellar
  return `G${randomPart}`;
}

/**
 * Obtiene información de un token
 * @param contractId - ID del contrato del token
 * @returns Información del token o null si no se pudo obtener
 */
export const getTokenInfo = async (contractId: string) => {
  try {
    // Usar el servicio API para obtener información del token
    return await tokenService.getTokenInfo(contractId);
  } catch (error) {
    console.error('Error obteniendo información del token:', error);
    return null;
  }
}; 