import { LLMService } from './llm.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { getAddressByEmail } from '../utils/supabase';

/**
 * Interfaz para la intención detectada del usuario
 */
export interface UserIntent {
  /** Tipo de intención detectada */
  intentType: 'balance_check' | 'send_payment' | 'create_account' | 'token_info' | 'transaction_history' | 'unknown';
  /** Confianza en la detección (0-1) */
  confidence: number;
  /** Parámetros extraídos del mensaje */
  params: {
    /** Dirección de wallet (si se detectó) */
    walletAddress?: string;
    /** Cantidad (si se detectó) */
    amount?: string;
    /** Tipo de token (si se detectó) */
    tokenType?: string;
    /** Destinatario (si se detectó) */
    recipient?: string;
    /** Email del destinatario (si se detectó) */
    recipientEmail?: string;
    /** Otros parámetros detectados */
    [key: string]: any;
  };
  /** Mensaje original */
  originalMessage: string;
  /** Respuesta sugerida al usuario */
  suggestedResponse?: string;
}

/**
 * Servicio para analizar la intención del usuario mediante LLM
 */
export class AgentService {
  /**
   * Analiza un mensaje de usuario para detectar su intención
   * @param message Mensaje del usuario
   * @returns Intención detectada con parámetros
   */
  static async analyzeUserIntent(message: string): Promise<UserIntent> {
    try {
      // Obtener el modelo LLM
      const llm = LLMService.getLLM();

      // Crear el parser para obtener JSON
      const parser = new JsonOutputParser<UserIntent>();

      // Crear el prompt para el análisis de intención
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Eres un asistente especializado en analizar mensajes de usuarios para una wallet de Stellar.
        Analiza el siguiente mensaje y extrae la intención del usuario y cualquier parámetro relevante.
        
        Posibles intenciones:
        - balance_check: El usuario quiere consultar su saldo
        - send_payment: El usuario quiere enviar un pago
        - create_account: El usuario quiere crear una cuenta
        - token_info: El usuario quiere información sobre un token
        - transaction_history: El usuario quiere ver su historial de transacciones
        - unknown: No se puede determinar la intención
        
        Mensaje del usuario: {message}
        
        Responde ÚNICAMENTE con un objeto JSON con la siguiente estructura:
        {
          "intentType": "tipo_de_intencion",
          "confidence": 0.95,
          "params": {
            "walletAddress": "direccion_si_se_menciona",
            "amount": "cantidad_si_se_menciona",
            "tokenType": "tipo_de_token_si_se_menciona",
            "recipient": "destinatario_si_se_menciona",
            "recipientEmail": "email_si_se_menciona"
          },
          "originalMessage": "mensaje_original",
          "suggestedResponse": "respuesta_sugerida_al_usuario"
        }
      `);

      // Crear la cadena de procesamiento
      const chain = promptTemplate.pipe(llm).pipe(parser);

      // Ejecutar la cadena con el mensaje del usuario
      const result = await chain.invoke({
        message: message
      });
      
      // Procesar el resultado para verificar si hay un email como destinatario
      return await this.processEmailRecipient(result);
    } catch (error) {
      console.error('Error al analizar la intención del usuario:', error);
      
      // Devolver una intención desconocida en caso de error
      return {
        intentType: 'unknown',
        confidence: 0,
        params: {},
        originalMessage: message,
        suggestedResponse: 'Lo siento, no pude entender tu solicitud. ¿Podrías reformularla?'
      };
    }
  }
  
  /**
   * Procesa la intención para verificar si hay un email como destinatario
   * @param intent Intención detectada por el LLM
   * @returns Intención procesada con la dirección de Stellar si el email está registrado
   */
  private static async processEmailRecipient(intent: UserIntent): Promise<UserIntent> {
    // Si no es una intención de envío de pago, devolver la intención sin cambios
    if (intent.intentType !== 'send_payment') {
      return intent;
    }
    
    // Verificar si hay un email como destinatario
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipientEmail = intent.params.recipientEmail || intent.params.recipient;
    
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
      return intent; // No hay email o el formato no es válido
    }
    
    // Guardar el email en los parámetros
    intent.params.recipientEmail = recipientEmail;
    
    // Verificar si el email está registrado en Supabase
    const addressResult = await getAddressByEmail(recipientEmail);
    
    if (addressResult.success && addressResult.address) {
      // Si el email está registrado, actualizar el destinatario con la dirección de Stellar
      intent.params.recipient = addressResult.address;
    } else {
      // Si el email no está registrado, actualizar la respuesta sugerida
      intent.suggestedResponse = `El email ${recipientEmail} no está asociado a ninguna wallet en nuestra plataforma.`;
    }
    
    return intent;
  }

  /**
   * Determina si una intención tiene suficiente confianza para ser procesada
   * @param intent Intención detectada
   * @returns true si la confianza es suficiente
   */
  static hasConfidence(intent: UserIntent): boolean {
    // Umbral de confianza mínimo para considerar válida una intención
    const CONFIDENCE_THRESHOLD = 0.7;
    return intent.confidence >= CONFIDENCE_THRESHOLD;
  }
}