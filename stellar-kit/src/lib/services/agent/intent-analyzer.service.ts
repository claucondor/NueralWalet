import { CustomToken, UserIntent } from './types';
import { LLMService } from '../llm.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { getAddressByEmail } from '../../utils/supabase';
import { DEFAULT_LANGUAGE } from './constants';

/**
 * Servicio para analizar la intención del usuario
 */
export class IntentAnalyzerService {
  /**
   * Analiza un mensaje de usuario para detectar su intención
   * @param message Mensaje del usuario
   * @param customTokens Tokens personalizados disponibles
   * @param conversationContext Contexto de conversación (mensajes anteriores)
   * @returns Intención detectada con parámetros
   */
  static async analyzeUserIntent(message: string, customTokens?: CustomToken[], conversationContext?: string): Promise<UserIntent> {
    try {
      // Obtener el modelo LLM
      const llm = LLMService.getLLM();

      // Crear el parser para obtener JSON
      const parser = new JsonOutputParser<UserIntent>();

      // Crear el prompt para el análisis de intención
      const promptTemplate = ChatPromptTemplate.fromTemplate(this.getAnalysisPrompt());

      // Crear la cadena de procesamiento
      const chain = promptTemplate.pipe(llm).pipe(parser);

      // Ejecutar la cadena con el mensaje del usuario
      const result = await chain.invoke({
        message: message,
        customTokens: customTokens ? JSON.stringify(customTokens) : '[]',
        conversationContext: conversationContext || ''
      });
      
      // Procesar el resultado para verificar si hay un email como destinatario
      return await this.processEmailRecipient(result);
    } catch (error) {
      console.error('Error al analizar la intención del usuario:', error);
      
      // Devolver una intención desconocida en caso de error
      return {
        intentType: 'unknown',
        confidence: 0,
        language: DEFAULT_LANGUAGE,
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
   * Obtiene el prompt para analizar la intención del usuario
   * @returns Texto del prompt para el análisis
   */
  private static getAnalysisPrompt(): string {
    return `
      Eres un asistente especializado en analizar mensajes de usuarios para una wallet de Stellar.
      Analiza el siguiente mensaje y extrae la intención del usuario, el idioma en que está escrito y cualquier parámetro relevante.
      
      Tokens personalizados disponibles: {customTokens}
      
      {conversationContext}
      
      Posibles intenciones:
      - balance_check: El usuario quiere consultar su saldo
      - send_payment: El usuario quiere enviar un pago
      - token_info: El usuario quiere información sobre un token
      - transaction_history: El usuario quiere ver su historial de transacciones
      - unknown: No se puede determinar la intención
      
      IMPORTANTE: Esta wallet solo soporta XLM (token nativo) y tokens Soroban. Debes especificar claramente en la respuesta:
      - Para XLM (nativo): siempre incluir "isNativeToken": true y "tokenAddress": "XLM" en los parámetros
      - Para tokens Soroban (no nativos): siempre incluir "isNativeToken": false y "tokenAddress": "<contrato_completo>" donde <contrato_completo> es el ID completo del contrato
      
      Si el usuario menciona cualquier otro tipo de token que no sea XLM o Soroban, marca la intención como 'unknown' y sugiere al usuario que solo podemos manejar tokens nativos (XLM) y tokens Soroban con su contrato correspondiente.
      
      Si el usuario menciona un token que no está en la lista de tokens personalizados disponibles, debes establecer la intención como 'unknown' y generar una respuesta que explique que ese token no está soportado por nuestra wallet. Sé específico mencionando el nombre del token no soportado.
      
      NUNCA devuelvas un tokenType sin especificar si es XLM o SOROBAN con su contrato completo.
      
      IMPORTANTE SOBRE EL IDIOMA: Debes detectar correctamente el idioma del mensaje del usuario. 
      Si el mensaje está en inglés, el campo "language" debe ser "en".
      Si el mensaje está en español, el campo "language" debe ser "es".
      La respuesta sugerida DEBE estar en el MISMO IDIOMA que el mensaje original del usuario.
      La respuesta sugerida debe ser un mensaje directo, sin frases introductorias ni explicaciones adicionales.
      
      Mensaje del usuario: {message}
      
      Si el usuario menciona un token personalizado (por símbolo o nombre), asócialo con su address correspondiente en los tokens personalizados.
      
      Responde ÚNICAMENTE con un objeto JSON con la siguiente estructura:
      {{
        "intentType": "tipo_de_intencion",
        "confidence": 0.95,
        "language": "idioma_detectado_en_el_mensaje", // Por ejemplo: 'es' para español, 'en' para inglés, 'fr' para francés, etc.
        "params": {{
          "walletAddress": "direccion_si_se_menciona",
          "amount": "cantidad_si_se_menciona",
          "isNativeToken": "booleano_indicando_si_es_token_nativo",
          "tokenAddress": "direccion_del_token_si_se_menciona",
          "recipient": "destinatario_si_se_menciona",
          "recipientEmail": "email_si_se_menciona"
        }},
        "originalMessage": "mensaje_original",
        "suggestedResponse": "respuesta_sugerida_al_usuario"
      }}
    `;
  }
} 