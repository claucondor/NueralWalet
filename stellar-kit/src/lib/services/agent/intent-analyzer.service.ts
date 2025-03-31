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
      // If email is not registered, update suggested response
      intent.suggestedResponse = `The email ${recipientEmail} is not associated with any wallet on our platform.`;
    }
    
    return intent;
  }

  /**
   * Gets the prompt to analyze user intent
   * @returns Prompt text for the analysis
   */
  private static getAnalysisPrompt(): string {
    return `
      You are an assistant specialized in analyzing user messages for a Stellar wallet.
      Analyze the following message and extract the user's intent, the language it's written in, and any relevant parameters.
      
      Available custom tokens: {customTokens}
      
      {conversationContext}
      
      Possible intents:
      - balance_check: User wants to check their balance
      - send_payment: User wants to send a payment
      - token_info: User wants information about a token
      - transaction_history: User wants to see their transaction history
      - unknown: Intent cannot be determined
      
      IMPORTANT: This wallet only supports XLM (native token) and Soroban tokens. You must clearly specify in the response:
      - For XLM (native): always include "isNativeToken": true and "tokenAddress": "XLM" in the parameters
      - For Soroban tokens (non-native): always include "isNativeToken": false and "tokenAddress": "<full_contract>" where <full_contract> is the complete contract ID
      
      If the user mentions any other type of token that isn't XLM or Soroban, mark the intent as 'unknown' and suggest to the user that we can only handle native tokens (XLM) and Soroban tokens with their corresponding contract.
      
      If the user mentions a token that is not in the list of available custom tokens, you must set the intent as 'unknown' and generate a response explaining that the token is not supported by our wallet. Be specific by mentioning the name of the unsupported token.
      
      NEVER return a tokenType without specifying if it's XLM or SOROBAN with its full contract.
      
      IMPORTANT ABOUT LANGUAGE: You must correctly detect the language of the user's message.
      If the message is in English, the "language" field should be "en".
      If the message is in Spanish, the "language" field should be "es".
      The suggested response MUST be in the SAME LANGUAGE as the user's original message.
      The suggested response should be a direct message, without introductory phrases or additional explanations.
      
      User message: {message}
      
      If the user mentions a custom token (by symbol or name), associate it with its corresponding address in the custom tokens.
      
      Respond ONLY with a JSON object with the following structure:
      {{
        "intentType": "intent_type",
        "confidence": 0.95,
        "language": "detected_language", // For example: 'es' for Spanish, 'en' for English, 'fr' for French, etc.
        "params": {{
          "walletAddress": "address_if_mentioned",
          "amount": "amount_if_mentioned",
          "isNativeToken": "boolean_indicating_if_native_token",
          "tokenAddress": "token_address_if_mentioned",
          "recipient": "recipient_if_mentioned",
          "recipientEmail": "email_if_mentioned"
        }},
        "originalMessage": "original_message",
        "suggestedResponse": "suggested_response_to_user"
      }}
    `;
  }
} 