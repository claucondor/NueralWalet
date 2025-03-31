import { PaymentResult } from '../../interfaces/wallet.interface';
import StellarWalletKit from '../..';

/**
 * Interfaz para la intención detectada del usuario
 */
export interface UserIntent {
  /** Tipo de intención detectada */
  intentType: IntentType;
  /** Confianza en la detección (0-1) */
  confidence: number;
  /** Idioma detectado en el mensaje del usuario */
  language: string;
  /** Parámetros extraídos del mensaje */
  params: UserIntentParams;
  /** Mensaje original */
  originalMessage: string;
  /** Respuesta sugerida al usuario */
  suggestedResponse?: string;
}

/**
 * Tipos de intenciones soportadas
 */
export type IntentType = 'balance_check' | 'send_payment' | 'token_info' | 'transaction_history' | 'unknown';

/**
 * Parámetros extraídos de la intención del usuario
 */
export interface UserIntentParams {
  /** Dirección de wallet (si se detectó) */
  walletAddress?: string;
  /** Cantidad (si se detectó) */
  amount?: string;
  /** Indica si el token es nativo (XLM) */
  isNativeToken?: boolean;
  /** Dirección del contrato del token (para tokens no nativos) */
  tokenAddress?: string;
  /** Destinatario (si se detectó) */
  recipient?: string;
  /** Email del destinatario (si se detectó) */
  recipientEmail?: string;
  /** Otros parámetros detectados */
  [key: string]: any;
}

/**
 * Resultado de una operación del agente
 */
export interface AgentResult {
  /** Indica si la operación fue exitosa */
  success: boolean;
  /** Mensaje para el usuario */
  message: string;
  /** Datos adicionales de la operación */
  data?: any;
}

/**
 * Parámetros para la generación de mensajes mediante LLM
 */
export interface MessageParams {
  /** Idioma en el que generar el mensaje */
  language: string;
  /** Detalles adicionales para la generación del mensaje */
  [key: string]: any;
}

/**
 * Token personalizado
 */
export interface CustomToken {
  /** Símbolo del token */
  symbol: string;
  /** Nombre del token */
  name: string;
  /** Dirección del contrato del token */
  address: string;
  /** Decimales del token */
  decimals: number;
} 