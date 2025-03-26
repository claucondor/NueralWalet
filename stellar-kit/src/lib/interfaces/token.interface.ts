/**
 * Interfaces relacionadas con tokens
 */

/**
 * Metadatos básicos del token
 */
export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  admin: string;
  totalSupply?: string;
}

/**
 * Información de balance del token
 */
export interface TokenBalance {
  address: string;
  balance: string;
  formattedBalance?: string;
}

/**
 * Información de transferencia del token
 */
export interface TokenTransfer {
  from: string;
  to: string;
  amount: string;
  timestamp?: string;
  transactionHash?: string;
}

/**
 * Información completa del contrato de token
 */
export interface TokenContractInfo {
  contractId: string;
  network: 'testnet' | 'mainnet';
  metadata: TokenMetadata;
}

/**
 * Información resumida del token
 */
export interface TokenInfo {
  contractId: string;
  name: string;
  symbol: string;
  decimals: number;
  admin: string;
  balance?: string;
  formattedBalance?: string;
} 