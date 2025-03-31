import { AgentResult, CustomToken, UserIntent } from './types';
import { IntentAnalyzerService } from './intent-analyzer.service';
import { BalanceHandlerService } from './handlers/balance-handler.service';
import { PaymentHandlerService } from './handlers/payment-handler.service';
import { MessageService } from './message.service';
import StellarWalletKit from '../..';
import { CONFIDENCE_THRESHOLD, DEFAULT_LANGUAGE } from './constants';

/**
 * Main agent service
 */
export class AgentService {
  /**
   * Analyzes a user message to detect intent
   * @param message User message
   * @param customTokens Available custom tokens
   * @param conversationContext Conversation context (previous messages)
   * @returns Detected intent with parameters
   */
  static async analyzeUserIntent(message: string, customTokens?: CustomToken[], conversationContext?: string): Promise<UserIntent> {
    return await IntentAnalyzerService.analyzeUserIntent(message, customTokens, conversationContext);
  }
  
  /**
   * Determines if an intent has enough confidence to be processed
   * @param intent Detected intent
   * @returns true if confidence is sufficient
   */
  static hasConfidence(intent: UserIntent): boolean {
    return intent.confidence >= CONFIDENCE_THRESHOLD;
  }
  
  /**
   * Processes user intent and executes the corresponding action
   * @param intent Detected intent
   * @param params Action parameters
   * @param fullPrivateKey Full Stellar private key
   * @param stellarPublicKey Stellar public key
   * @param originalMessage Original user message
   * @param language Response language
   * @returns Operation result with user-friendly message
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
      const stellarKit = StellarWalletKit;
      
      switch (intent) {
        case 'balance_check':
          return await BalanceHandlerService.processBalanceCheck(stellarKit, stellarPublicKey, language);
          
        case 'send_payment':
          return await PaymentHandlerService.processSendPayment(stellarKit, fullPrivateKey, stellarPublicKey, params, language);
          
        // Additional handlers for other intents could be added here
        // case 'token_info':
        // case 'transaction_history':
        // etc.
        
        case 'informative_response':
          if (params.suggestedResponse) {
            return {
              success: true,
              message: params.suggestedResponse
            };
          }
          
          const helpMessage = await MessageService.generateErrorMessage(
            MessageService.templates.genericHelp,
            { language }
          );
          
          return {
            success: true,
            message: helpMessage
          };
          
        default:
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
      console.error('Error processing intent:', error);
      
      const errorMessage = await MessageService.generateErrorMessage(
        MessageService.templates.genericError,
        {
          language,
          error: error.message || 'Unknown error'
        }
      );
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }
} 