import { AgentResult, CustomToken, UserIntent } from './types';
import { IntentAnalyzerService } from './intent-analyzer.service';
import { BalanceHandlerService } from './handlers/balance-handler.service';
import { PaymentHandlerService } from './handlers/payment-handler.service';
import { MessageService } from './message.service';
import StellarWalletKit from '../..';
import { CONFIDENCE_THRESHOLD, DEFAULT_LANGUAGE } from './constants';

/**
 * Servicio principal del agente
 */
export class AgentService {
  /**
   * Analiza un mensaje de usuario para detectar su intención
   * @param message Mensaje del usuario
   * @param customTokens Tokens personalizados disponibles
   * @param conversationContext Contexto de conversación (mensajes anteriores)
   * @returns Intención detectada con parámetros
   */
  static async analyzeUserIntent(message: string, customTokens?: CustomToken[], conversationContext?: string): Promise<UserIntent> {
    return await IntentAnalyzerService.analyzeUserIntent(message, customTokens, conversationContext);
  }
  
  /**
   * Determina si una intención tiene suficiente confianza para ser procesada
   * @param intent Intención detectada
   * @returns true si la confianza es suficiente
   */
  static hasConfidence(intent: UserIntent): boolean {
    return intent.confidence >= CONFIDENCE_THRESHOLD;
  }
  
  /**
   * Procesa la intención del usuario y ejecuta la acción correspondiente
   * @param intent Intención detectada
   * @param params Parámetros para la acción
   * @param fullPrivateKey Clave privada completa de Stellar
   * @param stellarPublicKey Clave pública de Stellar
   * @param originalMessage Mensaje original del usuario
   * @param language Idioma para la respuesta
   * @returns Resultado de la operación con mensaje amigable para el usuario
   */
  static async processIntent(
    intent: string,
    params: Record<string, any>,
    fullPrivateKey: string,
    stellarPublicKey: string,
    originalMessage?: string,
    language: string = DEFAULT_LANGUAGE
  ): Promise<AgentResult> {
    try {
      // Obtener instancia del kit de Stellar
      const stellarKit = StellarWalletKit;
      
      // Procesar según la intención detectada
      switch (intent) {
        case 'balance_check':
          return await BalanceHandlerService.processBalanceCheck(stellarKit, stellarPublicKey, language);
          
        case 'send_payment':
          return await PaymentHandlerService.processSendPayment(stellarKit, fullPrivateKey, stellarPublicKey, params, language);
          
        // Aquí podrían agregarse más manejadores para otras intenciones
        // case 'token_info':
        // case 'transaction_history':
        // etc.
        
        case 'informative_response':
          // Si hay una respuesta sugerida en los parámetros, utilizarla
          if (params.suggestedResponse) {
            return {
              success: true,
              message: params.suggestedResponse
            };
          }
          // Si no hay respuesta sugerida, generar una genérica
          const helpMessage = await MessageService.generateErrorMessage(
            MessageService.templates.genericHelp,
            { language }
          );
          
          return {
            success: true,
            message: helpMessage
          };
          
        default:
          // Generar mensaje para intención desconocida
          const errorMessage = await MessageService.generateErrorMessage(
            MessageService.templates.unknownIntent,
            { language }
          );
          
          return {
            success: false,
            message: errorMessage
          };
      }
    } catch (error: any) {
      console.error('Error procesando la intención:', error);
      
      // Generar mensaje de error genérico
      const errorMessage = await MessageService.generateErrorMessage(
        MessageService.templates.genericError,
        {
          language,
          error: error.message || 'Error desconocido'
        }
      );
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }
} 