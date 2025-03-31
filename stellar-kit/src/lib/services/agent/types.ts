import { PaymentResult } from '../../interfaces/wallet.interface';
import StellarWalletKit from '../..';

/**
 * Interface for detected user intent
 */
export interface UserIntent {
  /** Type of detected intent */
  intentType: IntentType;
  /** Detection confidence (0-1) */
  confidence: number;
  /** Language detected in user message */
  language: string;
  /** Parameters extracted from message */
  params: UserIntentParams;
  /** Original message */
  originalMessage: string;
  /** Suggested response to user */
  suggestedResponse?: string;
}

/**
 * Supported intent types
 */
export type IntentType = 'balance_check' | 'send_payment' | 'token_info' | 'transaction_history' | 'informative_response' | 'unknown';

/**
 * Parameters extracted from user intent
 */
export interface UserIntentParams {
  /** Wallet address (if detected) */
  walletAddress?: string;
  /** Amount (if detected) */
  amount?: string;
  /** Indicates if token is native (XLM) */
  isNativeToken?: boolean;
  /** Token contract address (for non-native tokens) */
  tokenAddress?: string;
  /** Recipient (if detected) */
  recipient?: string;
  /** Recipient email (if detected) */
  recipientEmail?: string;
  /** Other detected parameters */
  [key: string]: any;
}

/**
 * Result of an agent operation
 */
export interface AgentResult {
  /** Indicates if operation was successful */
  success: boolean;
  /** Message for user */
  message: string;
  /** Additional operation data */
  data?: any;
}

/**
 * Parameters for message generation using LLM
 */
export interface MessageParams {
  /** Language to generate message in */
  language: string;
  /** Additional details for message generation */
  [key: string]: any;
}

/**
 * Custom token
 */
export interface CustomToken {
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Token contract address */
  address: string;
  /** Token decimals */
  decimals: number;
} 