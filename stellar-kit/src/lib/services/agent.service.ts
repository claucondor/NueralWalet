import { LLMService } from './llm.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { getAddressByEmail } from '../utils/supabase';
import StellarWalletKit from '..';
import { PaymentResult } from '../interfaces/wallet.interface';
import { CustomToken } from '../../server/handlers/agentHandlers';

/**
 * Interfaz para la intención detectada del usuario
 */
export interface UserIntent {
  /** Tipo de intención detectada */
  intentType: 'balance_check' | 'send_payment' | 'token_info' | 'transaction_history' | 'unknown';
  /** Confianza en la detección (0-1) */
  confidence: number;
  /** Idioma detectado en el mensaje del usuario */
  language: string;
  /** Parámetros extraídos del mensaje */
  params: {
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
  static async analyzeUserIntent(message: string, customTokens?: CustomToken[]): Promise<UserIntent> {
    try {
      // Obtener el modelo LLM con timeout aumentado
      const llm = LLMService.getLLM();

      // Crear el parser para obtener JSON
      const parser = new JsonOutputParser<UserIntent>();

      // Acortar y simplificar el prompt para el análisis de intención
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Analiza este mensaje de usuario para una wallet Stellar. Extrae la intención, idioma y parámetros.
        
        Tokens personalizados disponibles: {customTokens}
        
        Posibles intenciones:
        - balance_check: Consulta de saldo
        - send_payment: Envío de pago
        - token_info: Información de token
        - transaction_history: Historial de transacciones
        - unknown: Intención desconocida
        
        Esta wallet soporta XLM (nativo) y tokens Soroban. 
        - Para XLM: "isNativeToken": true, "tokenAddress": "XLM"
        - Para Soroban: "isNativeToken": false, "tokenAddress": "<contrato_completo>"
        
        Mensaje: {message}
        
        Responde solo con un objeto JSON:
        {{
          "intentType": "tipo_intencion",
          "confidence": 0.0-1.0,
          "language": "codigo_idioma",
          "params": {{
            "walletAddress": "direccion_si_se_menciona",
            "amount": "cantidad_si_se_menciona",
            "isNativeToken": true/false,
            "tokenAddress": "XLM_o_direccion",
            "recipient": "destinatario_si_se_menciona",
            "recipientEmail": "email_si_se_menciona"
          }},
          "originalMessage": "{message}",
          "suggestedResponse": "respuesta_sugerida"
        }}
      `);

      // Crear la cadena de procesamiento con timeout
      const chain = promptTemplate.pipe(llm).pipe(parser);

      // Ejecutar la cadena con el mensaje del usuario
      const result = await chain.invoke({
        message: message,
        customTokens: customTokens ? JSON.stringify(customTokens) : '[]'
      });
      
      // Procesar el resultado para verificar si hay un email como destinatario
      return await this.processEmailRecipient(result);
    } catch (error) {
      console.error('Error al analizar la intención del usuario:', error);
      
      // Devolver una intención desconocida en caso de error
      return {
        intentType: 'unknown',
        confidence: 0,
        language: 'es', // Añadimos el idioma por defecto (español)
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
  
  /**
   * Procesa la intención del usuario y ejecuta la acción correspondiente
   * @param intent Intención detectada
   * @param params Parámetros para la acción
   * @param fullPrivateKey Clave privada completa de Stellar
   * @returns Resultado de la operación con mensaje amigable para el usuario
   */
  static async processIntent(
    intent: string,
    params: Record<string, any>,
    fullPrivateKey: string,
    stellarPublicKey: string,
    originalMessage?: string,
    language: string = 'es' // Idioma por defecto: español
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Obtener instancia del kit de Stellar
      const stellarKit = StellarWalletKit;
      
      // Procesar según la intención detectada
      switch (intent) {
        case 'balance_check':
          return await this.processBalanceCheck(stellarKit, stellarPublicKey, language);
          
        case 'send_payment':
          return await this.processSendPayment(stellarKit, fullPrivateKey, stellarPublicKey, params, language);
          
        case 'create_account':
          return await this.processCreateAccount(stellarKit, fullPrivateKey, params, language);
          
        case 'token_info':
          return await this.processTokenInfo(stellarKit, stellarPublicKey, params, language);
          
        case 'transaction_history':
          return await this.processTransactionHistory(stellarKit, stellarPublicKey, originalMessage || params.originalMessage, language);
          
        default:
          // Usar LLM para mensaje de error en el idioma correcto
          const llm = LLMService.getLLM();
          const promptTemplate = ChatPromptTemplate.fromTemplate(`
            Eres un asistente financiero amigable. El usuario envió una solicitud que no pudo ser procesada.
            
            Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
            Explica que no se pudo procesar la intención y sugiere intentar con una solicitud diferente.
          `);
          
          const chain = promptTemplate.pipe(llm);
          const result = await chain.invoke({ language });
          
          return {
            success: false,
            message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
          };
      }
    } catch (error: any) {
      console.error('Error procesando la intención:', error);
      
      // Usar LLM para mensaje de error en el idioma correcto
      const llm = LLMService.getLLM();
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Eres un asistente financiero amigable. Ocurrió un error al procesar la solicitud del usuario.
        
        Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
        Explica que ocurrió un error y sugiere intentar más tarde.
        
        Detalles técnicos (solo para referencia): {error}
      `);
      
      const chain = promptTemplate.pipe(llm);
      const result = await chain.invoke({ error: error.message, language });
      
      return {
        success: false,
        message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
      };
    }
  }
  
  /**
   * Procesa la intención de consulta de saldo
   */
  private static async processBalanceCheck(stellarKit: typeof StellarWalletKit, publicKey: string, language: string = 'es') {
    try {
      // Obtener información de la cuenta
      const accountInfo = await stellarKit.getAccountInfo(publicKey);
      
      if (!accountInfo) {
        // Usar LLM para mensaje de error en el idioma correcto
        const llm = LLMService.getLLM();
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
          Eres un asistente financiero amigable. El usuario intentó consultar su saldo pero no fue posible encontrar su cuenta.
          
          Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
          Explica que la cuenta no fue encontrada y puede que no esté activada en la red Stellar.
        `);
        
        const chain = promptTemplate.pipe(llm);
        const result = await chain.invoke({ language });
        
        return {
          success: false,
          message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
        };
      }
      
      // Generar mensaje amigable con el LLM
      const llm = LLMService.getLLM();
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Eres un asistente financiero amigable. El usuario ha solicitado su saldo en su wallet de Stellar.
        La cuenta tiene un saldo de {balance} XLM.
        
        Genera una respuesta amigable y profesional informando al usuario sobre su saldo actual.
        Incluye el saldo exacto pero también usa un tono conversacional.
        
        IMPORTANTE: Tu respuesta DEBE estar en el siguiente idioma: {language}.
        Si el idioma es 'es', responde en español.
        Si el idioma es 'en', responde en inglés.
        Si el idioma es 'fr', responde en francés.
        Si el idioma es 'pt', responde en portugués.
        Si el idioma es 'de', responde en alemán.
        Para cualquier otro código de idioma, intenta responder en ese idioma.
      `);
      
      const chain = promptTemplate.pipe(llm);
      const result = await chain.invoke({ balance: accountInfo.balance, language });
      
      return {
        success: true,
        message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content),
        data: { balance: accountInfo.balance }
      };
    } catch (error: any) {
      console.error('Error al consultar saldo:', error);
      
      // Usar LLM para mensaje de error en el idioma correcto
      const llm = LLMService.getLLM();
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Eres un asistente financiero amigable. Ocurrió un error al consultar el saldo del usuario.
        
        Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
        Explica que ocurrió un error y sugiere intentar más tarde.
        
        Detalles técnicos (solo para referencia): {error}
      `);
      
      const chain = promptTemplate.pipe(llm);
      const result = await chain.invoke({ error: error.message, language });
      
      return {
        success: false,
        message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
      };
    }
  }
  
  /**
   * Procesa la intención de envío de pago
   */
  private static async processSendPayment(
    stellarKit: typeof StellarWalletKit,
    privateKey: string,
    publicKey: string,
    params: Record<string, any>,
    language: string = 'es'
  ) {
    // Verificar si es un token Soroban
    const isSorobanToken = params.tokenAddress && !params.isNativeToken;
    
    if (isSorobanToken) {
      try {
        // Verificar que tenemos los parámetros necesarios
        const { recipient, amount, tokenAddress, isNativeToken } = params;
        
        if (!recipient || !amount || !tokenAddress || isNativeToken === undefined) {
          const llm = LLMService.getLLM();
          const promptTemplate = ChatPromptTemplate.fromTemplate(`
            Eres un asistente financiero amigable. El usuario intentó enviar un pago pero faltan parámetros requeridos.
            
            Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
            Explica que es necesario especificar destinatario, cantidad y dirección del token para completar la operación.
          `);
          
          const chain = promptTemplate.pipe(llm);
          const result = await chain.invoke({ language });
          
          return {
            success: false,
            message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
          };
        }
        
        // Realizar transferencia de token Soroban
        const result = await stellarKit.sendToken(
          tokenAddress,
          privateKey,
          recipient,
          amount
        );
        
        if (result.success) {
          const llm = LLMService.getLLM();
          const promptTemplate = ChatPromptTemplate.fromTemplate(`
            Eres un asistente financiero amigable. El usuario ha enviado con éxito {amount} tokens.
            
            Genera un mensaje de confirmación en el siguiente idioma: {language}.
            Incluye el hash de la transacción: {result.hash}.
          `);
          
          const chain = promptTemplate.pipe(llm);
          const resultMsg = await chain.invoke({
            amount,
            language,
            'result.hash': result.hash
          });
          
          return {
            success: true,
            message: typeof resultMsg.content === 'string' ? resultMsg.content : JSON.stringify(resultMsg.content),
            data: { hash: result.hash }
          };
        } else {
          // Usar LLM para mensaje de error en el idioma correcto
          const llm = LLMService.getLLM();
          const promptTemplate = ChatPromptTemplate.fromTemplate(`
            Eres un asistente financiero amigable. El usuario ha intentado enviar tokens Soroban pero la operación falló.
            
            Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
            Explica que no se pudieron enviar los tokens y sugiere intentar más tarde.
            
            Detalles técnicos (solo para referencia): {error_details}
          `);
          
          const chain = promptTemplate.pipe(llm);
          const response = await chain.invoke({ 
            error_details: result.error || 'Error desconocido',
            language 
          });
          
          return {
            success: false,
            message: typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
          };
        }
      } catch (error: any) {
        // Usar LLM para mensaje de error en el idioma correcto
        const llm = LLMService.getLLM();
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
          Eres un asistente financiero amigable. Ocurrió un error al procesar el pago con token Soroban.
          
          Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
          Explica que ocurrió un error al procesar el pago y sugiere intentar más tarde.
          
          Detalles técnicos (solo para referencia): {error}
        `);
        
        const chain = promptTemplate.pipe(llm);
        const response = await chain.invoke({ error: error.message || 'Error desconocido', language });
        
        return {
          success: false,
          message: typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
        };
      }
    }
    // Verificar si es un token Soroban (versión alternativa)
    const isSorobanTokenByType = params.tokenType && params.tokenType.startsWith('SOROBAN:');
    
    if (isSorobanTokenByType) {
      // Lógica específica para tokens Soroban
      const contractId = params.tokenType.split(':')[1];
      // Implementar lógica de pago con contrato Soroban
    }
    try {
      // Verificar que tenemos los parámetros necesarios
      const { recipient, amount } = params;
      
      if (!recipient) {
        // Usar LLM para mensaje de error en el idioma correcto
        const llm = LLMService.getLLM();
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
          Eres un asistente financiero amigable. El usuario intentó enviar un pago pero no especificó un destinatario.
          
          Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
          Explica que es necesario especificar un destinatario para completar la operación.
        `);
        
        const chain = promptTemplate.pipe(llm);
        const result = await chain.invoke({ language });
        
        return {
          success: false,
          message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
        };
      }
      
      if (!amount) {
        // Usar LLM para mensaje de error en el idioma correcto
        const llm = LLMService.getLLM();
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
          Eres un asistente financiero amigable. El usuario intentó enviar un pago pero no especificó una cantidad.
          
          Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
          Explica que es necesario especificar una cantidad para completar la operación.
        `);
        
        const chain = promptTemplate.pipe(llm);
        const result = await chain.invoke({ language });
        
        return {
          success: false,
          message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
        };
      }
      
      // Verificar que la cuenta tiene saldo suficiente
      const accountInfo = await stellarKit.getAccountInfo(publicKey);
      
      if (!accountInfo) {
        // Usar LLM para mensaje de error en el idioma correcto
        const llm = LLMService.getLLM();
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
          Eres un asistente financiero amigable. El usuario intentó enviar un pago pero su cuenta no fue encontrada.
          
          Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
          Explica que la cuenta no fue encontrada y puede que no esté activada en la red Stellar.
        `);
        
        const chain = promptTemplate.pipe(llm);
        const result = await chain.invoke({ language });
        
        return {
          success: false,
          message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
        };
      }
      
      const balance = parseFloat(accountInfo.balance || '0');
      const amountToSend = parseFloat(amount);
      
      // Verificar que hay saldo suficiente (considerando la reserva mínima de 1 XLM)
      if (balance - amountToSend < 1) {
        // Usar LLM para mensaje de error en el idioma correcto
        const llm = LLMService.getLLM();
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
          Eres un asistente financiero amigable. El usuario intentó enviar un pago pero no tiene saldo suficiente.
          
          Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
          Informa que el saldo actual es de {balance} XLM y necesita mantener al menos 1 XLM como reserva.
        `);
        
        const chain = promptTemplate.pipe(llm);
        const result = await chain.invoke({ language, balance });
        
        return {
          success: false,
          message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
        };
      }
      
      // Realizar el pago
      const paymentResult = await stellarKit.sendPayment(
        privateKey,
        recipient,
        amount.toString(),
        { memo: 'Pago desde GuardWallet' }
      );
      
      // Generar mensaje según el resultado usando LLM
      return await this.generatePaymentResponseMessage(paymentResult, amount, recipient, language);
    } catch (error: any) {
      console.error('Error al enviar pago:', error);
      
      // Usar LLM para mensaje de error en el idioma correcto
      const llm = LLMService.getLLM();
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Eres un asistente financiero amigable. Ocurrió un error al procesar el pago.
        
        Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
        Explica que ocurrió un error al procesar el pago y sugiere intentar más tarde.
        
        Detalles técnicos (solo para referencia): {error}
      `);
      
      const chain = promptTemplate.pipe(llm);
      const result = await chain.invoke({ error: error.message, language });
      
      return {
        success: false,
        message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
      };
    }
  }
  
  /**
   * Procesa la intención de creación de cuenta
   */
  private static async processCreateAccount(
    stellarKit: typeof StellarWalletKit,
    privateKey: string,
    params: Record<string, any>,
    language: string = 'es'
  ) {
    try {
      // Verificar que tenemos los parámetros necesarios
      const { recipient, amount } = params;
      const startingBalance = amount || '1'; // Si no se especifica, usar 1 XLM como balance inicial
      
      if (!recipient) {
        // Usar LLM para mensaje de error en el idioma correcto
        const llm = LLMService.getLLM();
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
          Eres un asistente financiero amigable. El usuario intentó crear una cuenta pero no especificó una dirección.
          
          Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
          Explica que es necesario especificar una dirección para crear una nueva cuenta en la red Stellar.
        `);
        
        const chain = promptTemplate.pipe(llm);
        const result = await chain.invoke({ language });
        
        return {
          success: false,
          message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
        };
      }
      
      // Crear la cuenta
      const result = await stellarKit.createAccount(
        privateKey,
        recipient,
        startingBalance,
        { memo: 'Creación de cuenta desde GuardWallet' }
      );
      
      if (result.success) {
        // Generar mensaje amigable con el LLM
        const llm = LLMService.getLLM();
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
          Eres un asistente financiero amigable. El usuario ha creado una nueva cuenta en la red Stellar.
          La cuenta se ha creado exitosamente con un balance inicial de {startingBalance} XLM.
          La dirección de la nueva cuenta es {recipient}.
          
          Genera una respuesta amigable y profesional informando al usuario sobre la creación exitosa de la cuenta.
          Incluye la dirección y el balance inicial, pero usa un tono conversacional.
          
          IMPORTANTE: Tu respuesta DEBE estar en el siguiente idioma: {language}.
          Si el idioma es 'es', responde en español.
          Si el idioma es 'en', responde en inglés.
          Si el idioma es 'fr', responde en francés.
          Si el idioma es 'pt', responde en portugués.
          Si el idioma es 'de', responde en alemán.
          Para cualquier otro código de idioma, intenta responder en ese idioma.
        `);
        
        const chain = promptTemplate.pipe(llm);
        const response = await chain.invoke({ startingBalance, recipient, language });
        
        return {
          success: true,
          message: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
          data: { hash: result.hash }
        };
      } else {
        // Usar LLM para mensaje de error en el idioma correcto
        const llm = LLMService.getLLM();
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
          Eres un asistente financiero amigable. El usuario intentó crear una cuenta pero la operación falló.
          
          Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
          Explica que no se pudo crear la cuenta y sugiere verificar la dirección e intentar nuevamente.
          
          Detalles técnicos (solo para referencia): {error_details}
        `);
        
        const chain = promptTemplate.pipe(llm);
        const response = await chain.invoke({ 
          error_details: result.error || 'Error desconocido', 
          language 
        });
        
        return {
          success: false,
          message: typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
        };
      }
    } catch (error: any) {
      console.error('Error al crear cuenta:', error);
      
      // Usar LLM para mensaje de error en el idioma correcto
      const llm = LLMService.getLLM();
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Eres un asistente financiero amigable. Ocurrió un error al intentar crear una cuenta en la red Stellar.
        
        Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
        Explica que ocurrió un error y sugiere intentar más tarde.
        
        Detalles técnicos (solo para referencia): {error}
      `);
      
      const chain = promptTemplate.pipe(llm);
      const result = await chain.invoke({ error: error.message || 'Error desconocido', language });
      
      return {
        success: false,
        message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
      };
    }
  }
  
  /**
   * Procesa la intención de consulta de información de token
   */
  private static async processTokenInfo(
    stellarKit: typeof StellarWalletKit,
    publicKey: string,
    params: Record<string, any>,
    language: string = 'es' // Idioma por defecto: español
  ) {
    try {
      // Por ahora, solo devolvemos información sobre XLM
      const accountInfo = await stellarKit.getAccountInfo(publicKey);
      
      if (!accountInfo) {
        // Usar LLM para mensaje de error en el idioma correcto
        const llm = LLMService.getLLM();
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
          Eres un asistente financiero amigable. El usuario intentó obtener información sobre tokens pero no fue posible encontrar su cuenta.
          
          Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
          Explica que la cuenta no fue encontrada y puede que no esté activada en la red Stellar.
        `);
        
        const chain = promptTemplate.pipe(llm);
        const result = await chain.invoke({ language });
        
        return {
          success: false,
          message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
        };
      }
      
      // Generar mensaje amigable con el LLM
      const llm = LLMService.getLLM();
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Eres un asistente financiero amigable. El usuario ha solicitado información sobre tokens en su wallet de Stellar.
        La cuenta tiene un saldo de {balance} XLM (Lumen), que es el token nativo de la red Stellar.
        
        Genera una respuesta amigable y profesional informando al usuario sobre su token XLM.
        Incluye información básica sobre XLM como que es el token nativo de Stellar y se usa para pagar comisiones de transacción.
        Usa un tono conversacional y educativo.
        
        IMPORTANTE: Tu respuesta DEBE estar en el siguiente idioma: {language}.
        Si el idioma es 'es', responde en español.
        Si el idioma es 'en', responde en inglés.
        Si el idioma es 'fr', responde en francés.
        Si el idioma es 'pt', responde en portugués.
        Si el idioma es 'de', responde en alemán.
        Para cualquier otro código de idioma, intenta responder en ese idioma.
      `);
      
      const chain = promptTemplate.pipe(llm);
      const result = await chain.invoke({ balance: accountInfo.balance, language });
      
      return {
        success: true,
        message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content),
        data: { balance: accountInfo.balance }
      };
    } catch (error: any) {
      console.error('Error al consultar información de token:', error);
      
      // Usar LLM para mensaje de error en el idioma correcto
      const llm = LLMService.getLLM();
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Eres un asistente financiero amigable. Ocurrió un error al obtener información sobre los tokens del usuario.
        
        Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
        Explica que ocurrió un error y sugiere intentar más tarde.
        
        Detalles técnicos (solo para referencia): {error}
      `);
      
      const chain = promptTemplate.pipe(llm);
      const result = await chain.invoke({ error: error.message, language });
      
      return {
        success: false,
        message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
      };
    }
  }
  
  /**
   * Procesa la intención de consulta de historial de transacciones
   * @param stellarKit Instancia del kit de Stellar
   * @param publicKey Clave pública de la cuenta
   * @param originalMessage Mensaje original del usuario (opcional)
   */
  private static async processTransactionHistory(
    stellarKit: typeof StellarWalletKit,
    publicKey: string,
    originalMessage?: string,
    language: string = 'es' // Idioma por defecto: español
  ) {
    try {
      // Obtener información de la cuenta para verificar que existe
      const accountInfo = await stellarKit.getAccountInfo(publicKey);
      
      if (!accountInfo) {
        // Usar LLM para mensaje de error en el idioma correcto
        const llm = LLMService.getLLM();
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
          Eres un asistente financiero amigable. El usuario intentó consultar su historial de transacciones pero no fue posible encontrar su cuenta.
          
          Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
          Explica que la cuenta no fue encontrada y puede que no esté activada en la red Stellar.
        `);
        
        const chain = promptTemplate.pipe(llm);
        const result = await chain.invoke({ language });
        
        return {
          success: false,
          message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
        };
      }
      
      // Obtener el historial de transacciones (limitado a 10 para el MVP)
      const transactionResult = await stellarKit.getTransactionHistory(publicKey, { limit: 10 });
      const transactions = transactionResult.transactions;
      
      // Si no hay transacciones, devolver un mensaje informativo
      if (!transactions || transactions.length === 0) {
        // Usar LLM para mensaje informativo en el idioma correcto
        const llm = LLMService.getLLM();
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
          Eres un asistente financiero amigable. El usuario ha solicitado su historial de transacciones pero no tiene ninguna transacción.
          
          Genera un mensaje informativo claro y útil en el siguiente idioma: {language}.
          Explica que no hay transacciones en su historial y que cuando realice operaciones en la red Stellar, aparecerán en su historial.
        `);
        
        const chain = promptTemplate.pipe(llm);
        const result = await chain.invoke({ language });
        
        return {
          success: true,
          message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content),
          data: { transactions: [] }
        };
      }
      
      // Preparar un resumen de las transacciones para el LLM
      const transactionsSummary = transactions.map((tx, index) => {
        // Extraer información relevante de cada transacción
        const date = new Date(tx.createdAt).toLocaleDateString();
        let type = 'desconocido';
        let amount = 'desconocido';
        let asset = 'XLM';
        let from = tx.sourceAccount;
        let to = 'desconocido';
        
        // Si hay operaciones, extraer información de la primera operación
        if (tx.operations && tx.operations.length > 0) {
          const op = tx.operations[0];
          type = op.type;
          amount = op.amount || 'desconocido';
          from = op.from || tx.sourceAccount;
          to = op.to || 'desconocido';
          
          if (op.assetCode) {
            asset = op.assetCode;
          }
        }
        
        return `Transacción ${index + 1}:\n- Fecha: ${date}\n- Tipo: ${type}\n- Cantidad: ${amount} ${asset}\n- De: ${from}\n- Para: ${to}${tx.memo ? `\n- Memo: ${tx.memo}` : ''}`;
      }).join('\n\n');
      
      // Generar mensaje amigable con el LLM
      const llm = LLMService.getLLM();
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Eres un asistente financiero amigable. El usuario ha solicitado su historial de transacciones en Stellar.
        
        Mensaje original del usuario: {originalMessage || "Ver mi historial de transacciones"}
        
        Aquí está el historial de las últimas transacciones de la cuenta:
        
        {transactionsSummary}
        
        Genera una respuesta amigable y profesional resumiendo el historial de transacciones del usuario.
        Menciona cuántas transacciones hay, los tipos más comunes, y cualquier patrón interesante que notes.
        Si hay pocas transacciones, puedes describirlas brevemente.
        Usa un tono conversacional y servicial.
        
        Importante: Analiza el mensaje original del usuario para entender si está buscando algo específico en su historial
        (como transacciones recientes, pagos a cierta persona, etc.) y personaliza tu respuesta en función de eso.
        
        IMPORTANTE: Tu respuesta DEBE estar en el siguiente idioma: {language}.
        Si el idioma es 'es', responde en español.
        Si el idioma es 'en', responde en inglés.
        Si el idioma es 'fr', responde en francés.
        Si el idioma es 'pt', responde en portugués.
        Si el idioma es 'de', responde en alemán.
        Para cualquier otro código de idioma, intenta responder en ese idioma.
      `);
      
      const chain = promptTemplate.pipe(llm);
      const result = await chain.invoke({ 
        language, 
        'originalMessage || "Ver mi historial de transacciones"': originalMessage || "Ver mi historial de transacciones",
        transactionsSummary 
      });
      
      return {
        success: true,
        message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content),
        data: { transactions: transactions }
      };
    } catch (error: any) {
      console.error('Error al consultar historial de transacciones:', error);
      
      // Usar LLM para mensaje de error en el idioma correcto
      const llm = LLMService.getLLM();
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Eres un asistente financiero amigable. Ocurrió un error al consultar el historial de transacciones del usuario.
        
        Genera un mensaje de error claro y útil en el siguiente idioma: {language}.
        Explica que ocurrió un error y sugiere intentar más tarde.
        
        Detalles técnicos (solo para referencia): {error}
      `);
      
      const chain = promptTemplate.pipe(llm);
      const result = await chain.invoke({ error: error.message, language });
      
      return {
        success: false,
        message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
      };
    }
  }
  
  /**
   * Genera un mensaje amigable para el usuario basado en el resultado del pago
   */
  private static async generatePaymentResponseMessage(
    paymentResult: PaymentResult,
    amount: string,
    recipient: string,
    language: string = 'es' // Idioma por defecto: español
  ) {
    const llm = LLMService.getLLM();
    
    if (paymentResult.success) {
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Eres un asistente financiero amigable. El usuario ha realizado un pago en Stellar.
        
        Detalles del pago:
        - Cantidad: {amount} XLM
        - Destinatario: {recipient}
        - Hash de la transacción: {paymentResult.hash}
        
        Genera una respuesta amigable y profesional confirmando que el pago se ha realizado con éxito.
        Incluye los detalles del pago pero usa un tono conversacional.
        
        IMPORTANTE: Tu respuesta DEBE estar en el siguiente idioma: {language}.
        Si el idioma es 'es', responde en español.
        Si el idioma es 'en', responde en inglés.
        Si el idioma es 'fr', responde en francés.
        Si el idioma es 'pt', responde en portugués.
        Si el idioma es 'de', responde en alemán.
        Para cualquier otro código de idioma, intenta responder en ese idioma.
      `);
      
      const chain = promptTemplate.pipe(llm);
      const result = await chain.invoke({
        amount,
        recipient,
        language,
        'paymentResult.hash': paymentResult.hash
      });
      
      return {
        success: true,
        message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content),
        data: { hash: paymentResult.hash }
      };
    } else {
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Eres un asistente financiero amigable. El usuario ha intentado realizar un pago en Stellar pero ha fallado.
        
        Detalles del intento de pago:
        - Cantidad: {amount} XLM
        - Destinatario: {recipient}
        - Error: {error_details}
        
        Genera una respuesta amigable y profesional explicando que el pago no se ha podido realizar.
        Incluye una explicación del error en términos que un usuario no técnico pueda entender.
        Sugiere posibles soluciones o alternativas.
        Usa un tono conversacional y servicial.
        
        IMPORTANTE: Tu respuesta DEBE estar en el siguiente idioma: {language}.
        Si el idioma es 'es', responde en español.
        Si el idioma es 'en', responde en inglés.
        Si el idioma es 'fr', responde en francés.
        Si el idioma es 'pt', responde en portugués.
        Si el idioma es 'de', responde en alemán.
        Para cualquier otro código de idioma, intenta responder en ese idioma.
      `);
      
      const chain = promptTemplate.pipe(llm);
      const response = await chain.invoke({ 
        amount,
        recipient,
        error_details: paymentResult.error || 'Error desconocido',
        language 
      });
      
      return {
        success: false,
        message: typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
      };
    }
  }
  
  /**
   * Genera un mensaje de error amigable para el usuario
   */
  private static async generateUserFriendlyErrorMessage(error: any, intent: string) {
    const llm = LLMService.getLLM();
    
    const promptTemplate = ChatPromptTemplate.fromTemplate(`
      Eres un asistente financiero amigable. El usuario ha intentado realizar una operación en Stellar pero ha ocurrido un error.
      
      Detalles del error:
      - Tipo de operación: {intent}
      - Error técnico: {error_details}
      
      Genera una respuesta amigable y profesional explicando que la operación no se ha podido realizar.
      Traduce el error técnico a un lenguaje que un usuario no técnico pueda entender.
      Sugiere posibles soluciones o alternativas.
      Usa un tono conversacional y servicial.
    `);
    
    const chain = promptTemplate.pipe(llm);
    const result = await chain.invoke({
      intent,
      error_details: error.message || 'Error desconocido',
      language: 'es'
    });
    
    return {
      success: false,
      message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
    };
  }

  private static async analyzeTransactionPatterns(transactions: any[], publicKey: string) {
    const analysis = {
        totalVolume: 0,
        transactionCount: transactions.length,
        frequency: 0,
        averageAmount: 0,
        largestTransaction: 0,
        netFlow: 0,
        debtRatio: 0,
        incomingCount: 0,
        outgoingCount: 0
    };

    transactions.forEach(tx => {
        const amount = parseFloat(tx.amount || '0');
        const isIncoming = tx.type === 'payment' && tx.to === publicKey;
        
        analysis.totalVolume += amount;
        analysis.netFlow += isIncoming ? amount : -amount;
        
        if (isIncoming) {
            analysis.incomingCount++;
        } else {
            analysis.outgoingCount++;
        }

        if (amount > analysis.largestTransaction) {
            analysis.largestTransaction = amount;
        }
    });

    analysis.averageAmount = analysis.totalVolume / analysis.transactionCount;
    analysis.frequency = analysis.transactionCount / 30; // Assuming 30 day period
    analysis.debtRatio = analysis.outgoingCount > 0 ? 
        (analysis.incomingCount / analysis.outgoingCount) : 0;

    return analysis;
}
}