/**
 * Constants used by the agent service
 */

/** Minimum confidence threshold to validate an intent */
export const CONFIDENCE_THRESHOLD = 0.7;

/** Default language for responses */
export const DEFAULT_LANGUAGE = 'en';

/** Minimum XLM reserve required in Stellar accounts */
export const MINIMUM_XLM_RESERVE = 1;

/** Default memo for transactions */
export const DEFAULT_PAYMENT_MEMO = 'Payment from GuardWallet';
export const DEFAULT_ACCOUNT_CREATION_MEMO = 'Account creation from GuardWallet';

/** Maximum number of transactions to get in history */
export const MAX_TRANSACTION_HISTORY = 10;

/** Default starting balance for account creation */
export const DEFAULT_STARTING_BALANCE = '1'; 