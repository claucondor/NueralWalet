/**
 * Servicio para interactuar con la API de Friend Vault
 */

import { apiRequest } from './stellarKitApi';

// Interfaces
export interface FriendVault {
  id: string;
  name: string;
  description: string;
  publicKey: string;
  createdBy: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
  balance: string;
  isCreator?: boolean;
  tokenBalances?: TokenBalance[];
}

export interface TokenBalance {
  tokenAddress: string;
  symbol: string;
  balance: string;
}

export interface WithdrawalRequest {
  id: string;
  vaultId: string;
  amount: string;
  tokenAddress: string;
  recipient: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  approvals: string[];
  rejections: string[];
  executedAt?: string;
  executedBy?: string;
  transactionHash?: string;
}

export interface CreateVaultPayload {
  name: string;
  description?: string;
  creatorEmail: string;
  memberEmails: string[];
}

export interface DepositPayload {
  vaultId: string;
  amount: string;
  tokenAddress?: string;
  senderPrivateKey: string;
  senderEmail: string;
}

export interface WithdrawalRequestPayload {
  vaultId: string;
  amount: string;
  tokenAddress?: string;
  recipient: string;
  requestedBy: string;
}

export interface VotePayload {
  requestId: string;
  voterEmail: string;
  vote: 'approve' | 'reject';
}

export interface ExecuteWithdrawalPayload {
  requestId: string;
  executorEmail: string;
}

// Servicio para Friend Vault
export const friendVaultService = {
  /**
   * Crea un nuevo Friend Vault
   */
  createVault: async (payload: CreateVaultPayload): Promise<FriendVault> => {
    try {
      const response = await apiRequest<FriendVault>('/friend-vault/create', 'POST', payload);
      return response.data;
    } catch (error) {
      console.error('Error creando Friend Vault:', error);
      throw error;
    }
  },

  /**
   * Obtiene los Friend Vaults asociados a un usuario
   */
  getVaultsByUser: async (email: string): Promise<FriendVault[]> => {
    try {
      const response = await apiRequest<FriendVault[]>(`/friend-vault/user/${email}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo Friend Vaults del usuario:', error);
      return [];
    }
  },

  /**
   * Obtiene detalles de un Friend Vault específico
   */
  getVaultDetails: async (vaultId: string, userEmail: string): Promise<FriendVault> => {
    try {
      const response = await apiRequest<FriendVault>(`/friend-vault/${vaultId}?userEmail=${userEmail}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo detalles del Friend Vault:', error);
      throw error;
    }
  },

  /**
   * Deposita fondos en un Friend Vault
   */
  depositToVault: async (payload: DepositPayload): Promise<{ transactionHash: string }> => {
    try {
      const response = await apiRequest<{ transaction: string }>('/friend-vault/deposit', 'POST', payload);
      return { transactionHash: response.data.transaction };
    } catch (error) {
      console.error('Error depositando en Friend Vault:', error);
      throw error;
    }
  },

  /**
   * Solicita un retiro de un Friend Vault
   */
  requestWithdrawal: async (payload: WithdrawalRequestPayload): Promise<{ requestId: string }> => {
    try {
      const response = await apiRequest<{ requestId: string }>('/friend-vault/request-withdrawal', 'POST', payload);
      return { requestId: response.data.requestId };
    } catch (error) {
      console.error('Error solicitando retiro de Friend Vault:', error);
      throw error;
    }
  },

  /**
   * Vota en una solicitud de retiro
   */
  voteOnWithdrawal: async (payload: VotePayload): Promise<{ status: string }> => {
    try {
      const response = await apiRequest<{ status: string }>('/friend-vault/vote-withdrawal', 'POST', payload);
      return { status: response.data.status };
    } catch (error) {
      console.error('Error votando en solicitud de retiro:', error);
      throw error;
    }
  },

  /**
   * Ejecuta un retiro aprobado
   */
  executeWithdrawal: async (payload: ExecuteWithdrawalPayload): Promise<{ transactionHash: string }> => {
    try {
      const response = await apiRequest<{ transaction: string }>('/friend-vault/execute-withdrawal', 'POST', payload);
      return { transactionHash: response.data.transaction };
    } catch (error) {
      console.error('Error ejecutando retiro de Friend Vault:', error);
      throw error;
    }
  },

  /**
   * Verifica si un email existe en la plataforma
   */
  checkEmail: async (email: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{ exists: boolean }>(`/user/check-email/${email}`);
      return response.data.exists;
    } catch (error) {
      console.error('Error verificando email:', error);
      return false;
    }
  }
}; 