/**
 * Interfaces relacionadas con wallets y transacciones
 */

/**
 * Respuesta de Friendbot
 */
export interface FriendbotResponse {
  hash: string;
  [key: string]: any;
}

/**
 * Par de claves
 */
export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

/**
 * Información de cuenta
 */
export interface AccountInfo {
  publicKey: string;
  secretKey: string;
  balance?: string;
  sequence?: string;
  subentryCount: number;
}

/**
 * Opciones para transacciones
 */
export interface TransactionOptions {
  memo?: string;
  timeoutInSeconds?: number;
}

/**
 * Resultado de una transacción
 */
export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: any;
}

/**
 * Resultado de un pago o transacción de token
 */
export interface PaymentResult {
  success: boolean;
  hash?: string;
  error?: string;
}

/**
 * Cuenta almacenada
 */
export interface StoredAccount {
  publicKey: string;
  secretKey: string;
  name?: string;
  dateCreated: string;
  network: 'testnet' | 'public';
}

/**
 * Opciones para consultar el historial de transacciones
 */
export interface TransactionHistoryOptions {
  limit?: number;
  order?: 'asc' | 'desc';
  cursor?: string;
  includeFailedTransactions?: boolean;
}

/**
 * Información de una transacción en el historial
 */
export interface TransactionInfo {
  id: string;
  hash: string;
  createdAt: string;
  sourceAccount: string;
  fee: string;
  memoType?: string;
  memo?: string;
  operationCount: number;
  operations?: OperationInfo[];
  successful: boolean;
  pagingToken: string;
}

/**
 * Información de una operación en una transacción
 */
export interface OperationInfo {
  id: string;
  type: string;
  sourceAccount?: string;
  createdAt: string;
  transactionHash: string;
  assetType?: string;
  assetCode?: string;
  assetIssuer?: string;
  amount?: string;
  from?: string;
  to?: string;
  pagingToken: string;
}