import { CustomToken, UserIntent } from './types';
import { LLMService } from '../llm.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { getAddressByEmail } from '../../utils/supabase';
import { DEFAULT_LANGUAGE } from './constants';

/**
 * Service for analyzing user intent
 */
export class IntentAnalyzerService {
  /**
   * Analyzes a user message to detect their intent
   * @param message User message
   * @param customTokens Available custom tokens
   * @param conversationContext Conversation context (previous messages)
   * @returns Detected intent with parameters
   */
  static async analyzeUserIntent(message: string, customTokens?: CustomToken[], conversationContext?: string): Promise<UserIntent> {
    try {
      const llm = LLMService.getLLM();
      const parser = new JsonOutputParser<UserIntent>();
      const promptTemplate = ChatPromptTemplate.fromTemplate(this.getAnalysisPrompt());
      const chain = promptTemplate.pipe(llm).pipe(parser);

      const result = await chain.invoke({
        message: message,
        customTokens: customTokens ? JSON.stringify(customTokens) : '[]',
        conversationContext: conversationContext || ''
      });
      
      return await this.processEmailRecipient(result);
    } catch (error) {
      console.error('Error analyzing user intent:', error);
      
      const defaultResponses = {
        en: "Sorry, I couldn't understand your request. Could you rephrase it?",
        es: "Lo siento, no pude entender tu solicitud. ¿Podrías reformularla?"
      };
      
      return {
        intentType: 'unknown',
        confidence: 0,
        language: DEFAULT_LANGUAGE,
        params: {},
        originalMessage: message,
        suggestedResponse: defaultResponses[DEFAULT_LANGUAGE]
      };
    }
  }
  
  /**
   * Processes the intent to check if there's an email as recipient
   * @param intent Intent detected by the LLM
   * @returns Processed intent with Stellar address if the email is registered
   */
  private static async processEmailRecipient(intent: UserIntent): Promise<UserIntent> {
    if (intent.intentType !== 'send_payment') {
      return intent;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipientEmail = intent.params.recipientEmail || intent.params.recipient;
    
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
      return intent;
    }
    
    intent.params.recipientEmail = recipientEmail;
    
    const addressResult = await getAddressByEmail(recipientEmail);
    
    if (addressResult.success && addressResult.address) {
      intent.params.recipient = addressResult.address;
    } else {
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
      - informative_response: User is asking for general information, help, or guidance
      - unknown: Intent cannot be determined
      
      IMPORTANT: This wallet only supports XLM (native token) and Soroban tokens. You must clearly specify in the response:
      - For XLM (native): always include "isNativeToken": true and "tokenAddress": "XLM" in the parameters
      - For Soroban tokens (non-native): always include "isNativeToken": false and "tokenAddress": "<full_contract>" where <full_contract> is the complete contract ID
      
      If the user mentions any other type of token that isn't XLM or Soroban, mark the intent as 'unknown' and suggest to the user that we can only handle native tokens (XLM) and Soroban tokens with their corresponding contract.
      
      If the user mentions a token that is not in the list of available custom tokens, you must set the intent as 'unknown' and generate a response explaining that the token is not supported by our wallet. Be specific by mentioning the name of the unsupported token.
      
      NEVER return a tokenType without specifying if it's XLM or SOROBAN with its full contract.
      
      For the 'informative_response' intent:
      - Use this when the user asks general questions about the wallet, how to do something, or when they need guidance
      - Also use this when the user's request doesn't fit into other specific intents but you can still provide a helpful response
      - You should always provide a clear response in the suggestedResponse field
      
      IMPORTANT ABOUT LANGUAGE: You must correctly detect the language of the user's message.
      If the message is in English, the "language" field should be "en".
      If the message is in Spanish, the "language" field should be "es".
      
      LANGUAGE PRIORITY:
      - English (en) responses should ALWAYS be prioritized over Spanish
      - Only respond in Spanish if the user's message is CLEARLY in Spanish
      - If there's any ambiguity about the language, default to English
      
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