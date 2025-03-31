/**
 * Servicio para interactuar con la API de StellarKit
 * Este servicio reemplaza el uso directo de StellarKit en el frontend
 */

import axios, { AxiosResponse } from 'axios';

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

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

/**
 * Función para hacer peticiones a la API del backend de Stellar Kit
 */
export async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}/api${endpoint}`;
    console.log(`🔄 API Request: ${method} ${url}`);
    
    const response: AxiosResponse<ApiResponse<T>> = await axios({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`✅ API Response success: ${response.status}`);
    
    // Si la respuesta no tiene la estructura esperada, normalizarla
    if (!response.data.hasOwnProperty('success')) {
      return {
        success: true,
        data: response.data as unknown as T,
      };
    }
    
    return response.data;
  } catch (error: any) {
    console.error(`❌ API Error: ${error.message}`, error);
    
    // Obtener datos del error si están disponibles
    const errorResponse = error.response?.data;
    
    // Crear una respuesta de error normalizada
    return {
      success: false,
      message: errorResponse?.message || error.message || 'Error en la petición',
      data: {} as T,
    };
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
   * Evaluates the credit score of an account
   */
  getCreditScore: async (publicKey: string, language: string = 'en'): Promise<CreditScoreResult | null> => {
    try {
      const response = await apiRequest<CreditScoreResult>(`/account/${publicKey}/credit-score?language=${language}`);
      return response.data;
    } catch (error) {
      console.error('Error getting credit score:', error);
      return null;
    }
  }
};

// Servicios de tokens
export const tokenService = {
  /**
   * Gets the list of loaded tokens
   */
  getTokenList: async (): Promise<TokenInfo[]> => {
    try {
      const response = await apiRequest<TokenInfo[]>('/token/list');
      return response.data;
    } catch (error) {
      console.error('Error getting token list:', error);
      return [];
    }
  },

  /**
   * Gets information for a token
   */
  getTokenInfo: async (contractId: string, sourceAccount?: string): Promise<TokenInfo | null> => {
    try {
      const queryParams = sourceAccount ? `?sourceAccount=${sourceAccount}` : '';
      const response = await apiRequest<TokenInfo>(`/token/info/${contractId}${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error getting token information:', error);
      return null;
    }
  },

  /**
   * Gets the token balance for an address
   */
  getTokenBalance: async (contractId: string, address: string): Promise<TokenBalance | null> => {
    try {
      const response = await apiRequest<TokenBalance>(`/token/balance/${contractId}/${address}`);
      return response.data;
    } catch (error) {
      console.error('Error getting token balance:', error);
      return null;
    }
  },

  /**
   * Sends tokens from one address to another
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
      console.error('Error sending tokens:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  /**
   * Mints new tokens (requires admin rights)
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
   * Burns tokens
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
      console.error('Error burning tokens:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
};

// Servicios de transacciones
export const transactionService = {
  /**
   * Makes a payment in XLM
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
        console.error('Error: response.data is not a valid object:', response.data);
        throw new Error('The API response does not contain valid data');
      }
    } catch (error) {
      console.error('Error sending payment:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
};