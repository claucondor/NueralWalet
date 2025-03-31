import { LLMService } from '../llm.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { MessageParams } from './types';

/**
 * Servicio para la generación de mensajes mediante LLM
 */
export class MessageService {
  /**
   * Genera un mensaje para una operación exitosa
   * @param template Plantilla del mensaje
   * @param params Parámetros para la generación del mensaje
   * @returns Mensaje generado
   */
  static async generateSuccessMessage(template: string, params: MessageParams): Promise<string> {
    const llm = LLMService.getLLM();
    const promptTemplate = ChatPromptTemplate.fromTemplate(this.addLanguageInstructions(template, params.language));
    
    const chain = promptTemplate.pipe(llm);
    const result = await chain.invoke(params);
    
    return typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
  }
  
  /**
   * Genera un mensaje de error
   * @param template Plantilla del mensaje de error
   * @param params Parámetros para la generación del mensaje
   * @returns Mensaje de error generado
   */
  static async generateErrorMessage(template: string, params: MessageParams): Promise<string> {
    const llm = LLMService.getLLM();
    const promptTemplate = ChatPromptTemplate.fromTemplate(this.addLanguageInstructions(template, params.language));
    
    const chain = promptTemplate.pipe(llm);
    const result = await chain.invoke(params);
    
    return typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
  }
  
  /**
   * Adds language instructions to a template
   * @param template Base template
   * @param language Desired language
   * @returns Template with language instructions
   */
  private static addLanguageInstructions(template: string, language: string): string {
    return `${template}
      
      IMPORTANT: Your response MUST be in the following language: ${language}.
      If the language is 'es', respond in Spanish.
      If the language is 'en', respond in English.
      If the language is 'fr', respond in French.
      If the language is 'pt', respond in Portuguese.
      If the language is 'de', respond in German.
      For any other language code, try to respond in that language.
      
      Your response must be EXACTLY the message for the user, without adding introductory phrases, without quotes, without additional explanations.
      Write as if you were the application directly speaking to the user.
    `;
  }

  /**
   * Common message templates
   */
  static templates = {
    // Balance templates
    balanceSuccess: `
      You are a friendly financial assistant. The user has requested their balance in their Stellar wallet.
      The account has a balance of {balance} XLM.
      
      Generate a friendly and professional response informing the user about their current balance.
      Include the exact balance but also use a conversational tone.
    `,
    
    accountNotFound: `
      You are a friendly financial assistant. The user tried to perform an operation but it was not possible to find their account.
      
      Generate a clear and helpful error message in the following language: {language}.
      Explain that the account was not found and may not be activated on the Stellar network.
    `,
    
    // Payment templates
    paymentSuccess: `
      You are a friendly financial assistant. The user has made a payment on Stellar.
      
      Payment details:
      - Amount: {amount} XLM
      - Recipient: {recipient}
      - Transaction hash: {hash}
      
      Generate a friendly and professional response confirming that the payment has been made successfully.
      Include the payment details but use a conversational tone.
    `,
    
    paymentFailed: `
      You are a friendly financial assistant. The user has tried to make a payment on Stellar but it has failed.
      
      Payment attempt details:
      - Amount: {amount} XLM
      - Recipient: {recipient}
      - Error: {error}
      
      Generate a friendly and professional response explaining that the payment could not be made.
      Include an explanation of the error in terms that a non-technical user can understand.
      Suggest possible solutions or alternatives.
      Use a conversational and helpful tone.
    `,
    
    missingRecipient: `
      You are a friendly financial assistant. The user tried to send a payment but did not specify a recipient.
      
      Generate a clear and helpful error message in the following language: {language}.
      Explain that it is necessary to specify a recipient to complete the operation.
    `,
    
    missingAmount: `
      You are a friendly financial assistant. The user tried to send a payment but did not specify an amount.
      
      Generate a clear and helpful error message in the following language: {language}.
      Explain that it is necessary to specify an amount to complete the operation.
    `,
    
    insufficientBalance: `
      You are a friendly financial assistant. The user tried to send a payment but does not have sufficient balance.
      
      Generate a clear and helpful error message in the following language: {language}.
      Inform that the current balance is {balance} XLM and they need to maintain at least {minimumReserve} XLM as a reserve.
    `,
    
    // Generic templates
    genericError: `
      You are a friendly financial assistant. An error occurred while processing the user's request.
      
      Generate a clear and helpful error message in the following language: {language}.
      Explain that an error occurred and suggest trying again later.
      
      Technical details (for reference only): {error}
    `,
    
    unknownIntent: `
      You are a friendly financial assistant. The user sent a request that could not be processed.
      
      Generate a clear and helpful error message in the following language: {language}.
      Explain that the intent could not be processed and suggest trying a different request.
    `
  };
} 