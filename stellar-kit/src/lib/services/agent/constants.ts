/**
 * Constantes utilizadas por el servicio de agente
 */

/** Umbral de confianza mínimo para validar una intención */
export const CONFIDENCE_THRESHOLD = 0.7;

/** Idioma por defecto para respuestas */
export const DEFAULT_LANGUAGE = 'es';

/** Reserva mínima requerida de XLM en cuentas Stellar */
export const MINIMUM_XLM_RESERVE = 1;

/** Memo predeterminado para transacciones */
export const DEFAULT_PAYMENT_MEMO = 'Pago desde GuardWallet';
export const DEFAULT_ACCOUNT_CREATION_MEMO = 'Creación de cuenta desde GuardWallet';

/** Número máximo de transacciones a obtener en el historial */
export const MAX_TRANSACTION_HISTORY = 10;

/** Balance inicial predeterminado para creación de cuentas */
export const DEFAULT_STARTING_BALANCE = '1'; 