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
   * Añade instrucciones de idioma a una plantilla
   * @param template Plantilla base
   * @param language Idioma deseado
   * @returns Plantilla con instrucciones de idioma
   */
  private static addLanguageInstructions(template: string, language: string): string {
    return `${template}
      
      IMPORTANTE: Tu respuesta DEBE estar en el siguiente idioma: ${language}.
      Si el idioma es 'es', responde en español.
      Si el idioma es 'en', responde en inglés.
      Si el idioma es 'fr', responde en francés.
      Si el idioma es 'pt', responde en portugués.
      Si el idioma es 'de', responde en alemán.
      Para cualquier otro código de idioma, intenta responder en ese idioma.
      
      Tu respuesta debe ser EXACTAMENTE el mensaje para el usuario, sin añadir frases introductorias, sin comillas, sin explicaciones adicionales.
      Escribe como si tú fueras directamente la aplicación hablando con el usuario.
    `;
  }

  /**
   * Plantillas de mensajes comunes
   */
  static templates = {
    // Plantillas para balance
    balanceSuccess: `
      Eres un asistente financiero amigable. El usuario ha solicitado su saldo en su wallet de Stellar.
      La cuenta tiene un saldo de {balance} XLM.
      
      Genera una respuesta amigable y profesional informando al usuario sobre su saldo actual.
      Incluye el saldo exacto pero también usa un tono conversacional.
    `,
    
    accountNotFound: `
      Eres un asistente financiero amigable. El usuario intentó realizar una operación pero no fue posible encontrar su cuenta.
      
      Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
      Explica que la cuenta no fue encontrada y puede que no esté activada en la red Stellar.
    `,
    
    // Plantillas para pagos
    paymentSuccess: `
      Eres un asistente financiero amigable. El usuario ha realizado un pago en Stellar.
      
      Detalles del pago:
      - Cantidad: {amount} XLM
      - Destinatario: {recipient}
      - Hash de la transacción: {hash}
      
      Genera una respuesta amigable y profesional confirmando que el pago se ha realizado con éxito.
      Incluye los detalles del pago pero usa un tono conversacional.
    `,
    
    paymentFailed: `
      Eres un asistente financiero amigable. El usuario ha intentado realizar un pago en Stellar pero ha fallado.
      
      Detalles del intento de pago:
      - Cantidad: {amount} XLM
      - Destinatario: {recipient}
      - Error: {error}
      
      Genera una respuesta amigable y profesional explicando que el pago no se ha podido realizar.
      Incluye una explicación del error en términos que un usuario no técnico pueda entender.
      Sugiere posibles soluciones o alternativas.
      Usa un tono conversacional y servicial.
    `,
    
    missingRecipient: `
      Eres un asistente financiero amigable. El usuario intentó enviar un pago pero no especificó un destinatario.
      
      Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
      Explica que es necesario especificar un destinatario para completar la operación.
    `,
    
    missingAmount: `
      Eres un asistente financiero amigable. El usuario intentó enviar un pago pero no especificó una cantidad.
      
      Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
      Explica que es necesario especificar una cantidad para completar la operación.
    `,
    
    insufficientBalance: `
      Eres un asistente financiero amigable. El usuario intentó enviar un pago pero no tiene saldo suficiente.
      
      Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
      Informa que el saldo actual es de {balance} XLM y necesita mantener al menos {minimumReserve} XLM como reserva.
    `,
    
    // Plantillas genéricas
    genericError: `
      Eres un asistente financiero amigable. Ocurrió un error al procesar la solicitud del usuario.
      
      Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
      Explica que ocurrió un error y sugiere intentar más tarde.
      
      Detalles técnicos (solo para referencia): {error}
    `,
    
    unknownIntent: `
      Eres un asistente financiero amigable. El usuario envió una solicitud que no pudo ser procesada.
      
      Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
      Explica que no se pudo procesar la intención y sugiere intentar con una solicitud diferente.
    `
  };
} 