import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarWalletKit } from '@/lib/stellar-kit';
import { stellarConfig } from '../config/stellar';

// Inicializar StellarWalletKit con configuración para testnet o mainnet según configuración
const isTestnet = stellarConfig.network === 'TESTNET';
const stellarKit = new StellarWalletKit(isTestnet);

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
    // Usar directamente el método getAccountInfo del kit
    const accountInfo = await stellarKit.getAccountInfo(accountAddress);
    
    if (!accountInfo) {
      return 0;
    }
    
    return parseFloat(accountInfo.balance || '0');
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
    if (!isTestnet) {
      console.error('No se puede solicitar XLM en mainnet');
      return false;
    }
    
    // Usar el método fundAccountWithFriendbot del kit
    const result = await stellarKit.fundAccountWithFriendbot(accountAddress);
    
    if (result.success) {
      console.log('Cuenta fondeada exitosamente:', result.hash);
      return true;
    } else {
      console.error('Error al fondear la cuenta:', result.error);
      return false;
    }
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
  try {
    // Usar directamente el método sendPayment del kit
    const result = await stellarKit.sendPayment(
      secretKey,
      recipientAddress,
      amount,
      options
    );
    
    return result;
  } catch (error) {
    console.error("Error enviando transacción:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
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
    // Generar un nuevo keypair para la cuenta a crear
    const newAccount = stellarKit.generateKeypair();
    
    // Usar el método createAccount del kit para financiar la nueva cuenta
    const result = await stellarKit.createAccount(
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
    
    // Simular pago exitoso
    
    // Usar friendbot para agregar tokens a la cuenta (para demo)
    let result = false;
    
    if (isTestnet) {
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
    // Primero verificar si el email existe en el sistema
    const response = await fetch(
      `${import.meta.env.VITE_MOVE_AGENT_SERVICE_URL || 'http://localhost:3001'}/api/user/check-email/${encodeURIComponent(recipientEmail)}`
    );
    
    const data = await response.json();
    
    if (!data.success || !data.data.exists) {
      throw new Error("El correo electrónico no está registrado en el sistema");
    }
    
    // Hacer una solicitud POST al servicio de Move Agent
    const sendResponse = await fetch(
      `${import.meta.env.VITE_MOVE_AGENT_SERVICE_URL || 'http://localhost:3001'}/api/wallet/send-by-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromSecretKey: secretKey,
          toEmail: recipientEmail,
          amount: parseFloat(amount),
          assetCode: options?.assetCode || "native",
          assetIssuer: options?.assetIssuer,
          memo: options?.memo || "Envío por email"
        }),
      }
    );
    
    if (!sendResponse.ok) {
      const errorData = await sendResponse.json();
      throw new Error(errorData.message || "Error al enviar transacción por email");
    }
    
    const responseData = await sendResponse.json();
    
    return {
      success: true,
      hash: responseData.data.hash
    };
  } catch (error) {
    console.error("Error enviando transacción por email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Carga información de un token
 * @param assetCode Código del token
 * @param assetIssuer Emisor del token
 * @param accountAddress Dirección de la cuenta
 * @returns Información del token
 */
export const loadToken = async (assetCode: string, assetIssuer: string, accountAddress: string) => {
  try {
    // Para tokens en Stellar, necesitamos agregar una trustline primero
    // Esto tendrá que implementarse usando las operaciones básicas de StellarSdk
    // ya que parece que stellarKit no tiene un método específico para esto
    
    // Obtenemos la cuenta
    const server = stellarKit.getServer();
    const account = await server.loadAccount(accountAddress);
    
    // Verificamos si ya existe la trustline
    const assetBalances = account.balances.filter(balance => 
      balance.asset_type !== 'native' && balance.asset_type !== 'liquidity_pool_shares'
    ) as StellarAssetBalance[];
    
    const hasAsset = assetBalances.some(balance => 
      balance.asset_code === assetCode && 
      balance.asset_issuer === assetIssuer
    );
    
    if (!hasAsset) {
      console.log(`Trustline para ${assetCode} no encontrada, deberá ser creada primero`);
    }
    
    // Obtenemos el balance
    const balance = await getTokenBalance(assetCode, assetIssuer, accountAddress);
    
    return {
      code: assetCode,
      issuer: assetIssuer,
      balance
    };
  } catch (error) {
    console.error('Error cargando token:', error);
    return null;
  }
};

/**
 * Obtiene el balance de un token
 * @param assetCode Código del token
 * @param assetIssuer Emisor del token
 * @param accountAddress Dirección de la cuenta
 * @returns Balance del token
 */
export const getTokenBalance = async (assetCode: string, assetIssuer: string, accountAddress: string): Promise<string | null> => {
  try {
    // Obtener todas las posiciones de activos del usuario
    const server = stellarKit.getServer();
    const accountInfo = await server.loadAccount(accountAddress);
    
    // Filtrar por no-nativas para tener solo balances de assets
    const assetBalances = accountInfo.balances.filter(balance => 
      balance.asset_type !== 'native' && balance.asset_type !== 'liquidity_pool_shares'
    ) as StellarAssetBalance[];
    
    // Buscar el balance del token especificado
    const assetBalance = assetBalances.find(balance => 
      balance.asset_code === assetCode && 
      balance.asset_issuer === assetIssuer
    );
    
    if (assetBalance) {
      return assetBalance.balance;
    }
    
    return '0';
  } catch (error) {
    console.error('Error obteniendo balance del token:', error);
    return null;
  }
}; 