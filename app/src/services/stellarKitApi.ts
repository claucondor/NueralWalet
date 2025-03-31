/**
 * Servicio para interactuar con la API de StellarKit
 * Este servicio reemplaza el uso directo de StellarKit en el frontend
 */

// Obtener la URL base de la API desde las variables de entorno
const API_BASE_URL = import.meta.env.VITE_STELLARKIT_API_URL || 'http://localhost:3000';

// Interfaces
export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

export interface AccountInfo {
  publicKey: string;
  secretKey: string;
  balance?: string;
  sequence?: string;
  subentryCount: number;
}

export interface TokenInfo {
  contractId: string;
  name: string;
  symbol: string;
  decimals: number;
  admin: string;
}

export interface TokenBalance {
  address: string;
  balance: string;
  formattedBalance?: string;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

export interface CreditScoreResult {
  success: boolean;
  data?: {
    analysis: {
      totalVolume: number;
      transactionCount: number;
      frequency: number;
      averageAmount: number;
      largestTransaction: number;
      netFlow: number;
      debtRatio: number;
      incomingCount: number;
      outgoingCount: number;
    };
    creditScore: {
      score: number;
      reason: string;
      improvementTips: string[];
    };
    englishRecommendation: string;
  };
  error?: string;
}

/**
 * Función auxiliar para realizar peticiones a la API
 */
async function apiRequest<T>(endpoint: string, method: string = 'GET', data?: Record<string, unknown>): Promise<{ data: T }> {
  try {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Error en la petición a la API');
    }

    return responseData as { data: T };
  } catch (error) {
    console.error(`Error en la petición a ${endpoint}:`, error);
    throw error;
  }
}

// Servicios de cuentas Stellar
export const accountService = {
  /**
   * Genera un nuevo par de claves Stellar
   */
  generateKeypair: async (): Promise<KeyPair> => {
    try {
      const response = await apiRequest<KeyPair>('/account/generate');
      return response.data;
    } catch (error) {
      console.error('Error generando keypair:', error);
      throw error;
    }
  },

  /**
   * Obtiene información de una cuenta
   */
  getAccountInfo: async (publicKey: string): Promise<AccountInfo | null> => {
    try {
      const response = await apiRequest<AccountInfo>(`/account/${publicKey}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo información de cuenta:', error);
      return null;
    }
  },

  /**
   * Fondea una cuenta con friendbot (testnet)
   */
  fundAccount: async (publicKey: string): Promise<TransactionResult> => {
    try {
      const response = await apiRequest<TransactionResult>('/account/fund', 'POST', { publicKey });
      return response.data;
    } catch (error) {
      console.error('Error fondeando cuenta:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  /**
   * Crea una nueva cuenta en la red Stellar
   */
  createAccount: async (
    sourceSecretKey: string,
    destinationPublicKey: string,
    startingBalance: string,
    memo?: string
  ): Promise<TransactionResult> => {
    try {
      const response = await apiRequest<TransactionResult>('/account/create', 'POST', {
        sourceSecretKey,
        destinationPublicKey,
        startingBalance,
        memo
      });
      return response.data;
    } catch (error) {
      console.error('Error creando cuenta:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  /**
   * Evalúa el score crediticio de una cuenta
   */
  getCreditScore: async (publicKey: string, language: string = 'es'): Promise<CreditScoreResult | null> => {
    try {
      const response = await apiRequest<CreditScoreResult>(`/account/${publicKey}/credit-score?language=${language}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo score crediticio:', error);
      return null;
    }
  }
};

// Servicios de tokens
export const tokenService = {
  /**
   * Obtiene la lista de tokens cargados
   */
  getTokenList: async (): Promise<TokenInfo[]> => {
    try {
      const response = await apiRequest<TokenInfo[]>('/token/list');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo lista de tokens:', error);
      return [];
    }
  },

  /**
   * Obtiene información de un token
   */
  getTokenInfo: async (contractId: string, sourceAccount?: string): Promise<TokenInfo | null> => {
    try {
      const queryParams = sourceAccount ? `?sourceAccount=${sourceAccount}` : '';
      const response = await apiRequest<TokenInfo>(`/token/info/${contractId}${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo información del token:', error);
      return null;
    }
  },

  /**
   * Obtiene el balance de un token para una dirección
   */
  getTokenBalance: async (contractId: string, address: string): Promise<TokenBalance | null> => {
    try {
      const response = await apiRequest<TokenBalance>(`/token/balance/${contractId}/${address}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo balance del token:', error);
      return null;
    }
  },

  /**
   * Envía tokens de una dirección a otra
   */
  sendToken: async (
    contractId: string,
    senderSecretKey: string,
    destinationPublicKey: string,
    amount: string
  ): Promise<TransactionResult> => {
    try {
      const response = await apiRequest<TransactionResult>('/token/send', 'POST', {
        contractId,
        senderSecretKey,
        destinationPublicKey,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Error enviando tokens:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  /**
   * Acuña nuevos tokens (requiere ser administrador)
   */
  mintToken: async (
    contractId: string,
    adminSecretKey: string,
    toPublicKey: string,
    amount: string
  ): Promise<TransactionResult> => {
    try {
      const response = await apiRequest<TransactionResult>('/token/mint', 'POST', {
        contractId,
        adminSecretKey,
        toPublicKey,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Error acuñando tokens:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  /**
   * Quema tokens
   */
  burnToken: async (
    contractId: string,
    ownerSecretKey: string,
    amount: string
  ): Promise<TransactionResult> => {
    try {
      const response = await apiRequest<TransactionResult>('/token/burn', 'POST', {
        contractId,
        ownerSecretKey,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Error quemando tokens:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
};

// Servicios de transacciones
export const transactionService = {
  /**
   * Realiza un pago en XLM
   */
  sendPayment: async (
    sourceSecretKey: string,
    destination: string,
    amount: string,
    memo?: string
  ): Promise<TransactionResult> => {
    try {
      const response = await apiRequest('/transaction/payment', 'POST', {
        sourceSecretKey,
        destination,
        amount,
        memo
      });
      if (typeof response.data === 'object' && response.data !== null) {
        return { success: true, ...response.data };
      } else {
        console.error('Error: response.data no es un objeto válido:', response.data);
        throw new Error('La respuesta de la API no contiene datos válidos');
      }
    } catch (error) {
      console.error('Error enviando pago:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
    }
};