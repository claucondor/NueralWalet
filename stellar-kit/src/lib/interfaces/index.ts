// Este archivo exportará todas las interfaces
// En una implementación completa, aquí se exportarían interfaces desde otros archivos

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

export interface AccountInfo {
  accountId: string;
  balances: {
    asset: string;
    balance: string;
  }[];
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

export interface PaymentResult extends TransactionResult {
  amount?: string;
  asset?: string;
  destination?: string;
}

export interface StoredAccount {
  publicKey: string;
  encryptedSecretKey?: string;
  name?: string;
}

export interface FriendbotResponse {
  successful: boolean;
  error?: string;
}

export interface TransactionOptions {
  memo?: string;
  timeout?: number;
} 