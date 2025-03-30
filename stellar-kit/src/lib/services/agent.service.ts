import { LLMService } from './llm.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { getAddressByEmail } from '../utils/supabase';
import StellarWalletKit from '..';
import { PaymentResult } from '../interfaces/wallet.interface';

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
    originalMessage?: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Obtener instancia del kit de Stellar
      const stellarKit = StellarWalletKit;
      
      // Procesar según la intención detectada
      switch (intent) {
        case 'balance_check':
          return await this.processBalanceCheck(stellarKit, stellarPublicKey);
          
        case 'send_payment':
          return await this.processSendPayment(stellarKit, fullPrivateKey, stellarPublicKey, params);
          
        case 'create_account':
          return await this.processCreateAccount(stellarKit, fullPrivateKey, params);
          
        case 'token_info':
          return await this.processTokenInfo(stellarKit, stellarPublicKey, params);
          
        case 'transaction_history':
          return await this.processTransactionHistory(stellarKit, stellarPublicKey, originalMessage || params.originalMessage);
          
        default:
          return {
            success: false,
            message: 'No se pudo procesar la intención. Por favor, intenta con una solicitud diferente.'
          };
      }
    } catch (error: any) {
      console.error('Error procesando la intención:', error);
      
      // Generar mensaje de error amigable para el usuario
      return await this.generateUserFriendlyErrorMessage(error, intent);
    }
  }
  
  /**
   * Procesa la intención de consulta de saldo
   */
  private static async processBalanceCheck(stellarKit: typeof StellarWalletKit, publicKey: string) {
    try {
      // Obtener información de la cuenta
      const accountInfo = await stellarKit.getAccountInfo(publicKey);
      
      if (!accountInfo) {
        return {
          success: false,
          message: 'No se pudo encontrar la cuenta. Es posible que no esté activada en la red Stellar.'
        };
      }
      
      // Generar mensaje amigable con el LLM
      const llm = LLMService.getLLM();
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Eres un asistente financiero amigable. El usuario ha solicitado su saldo en su wallet de Stellar.
        La cuenta tiene un saldo de ${accountInfo.balance} XLM.
        
        Genera una respuesta amigable y profesional informando al usuario sobre su saldo actual.
        Incluye el saldo exacto pero también usa un tono conversacional.
      `);
      
      const chain = promptTemplate.pipe(llm);
      const result = await chain.invoke({});
      
      if (!accountInfo) {
        return {
          success: false,
          message: 'No se pudo encontrar la cuenta. Es posible que no esté activada en la red Stellar.'
        };
      }
      
      return {
        success: true,
        message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content),
        data: { balance: accountInfo.balance }
      };
    } catch (error: any) {
      console.error('Error al consultar saldo:', error);
      return {
        success: false,
        message: 'Lo siento, no pude consultar tu saldo en este momento. Por favor, intenta más tarde.'
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
    params: Record<string, any>
  ) {
    try {
      // Verificar que tenemos los parámetros necesarios
      const { recipient, amount } = params;
      
      if (!recipient) {
        return {
          success: false,
          message: 'No se especificó un destinatario para el pago.'
        };
      }
      
      if (!amount) {
        return {
          success: false,
          message: 'No se especificó una cantidad para el pago.'
        };
      }
      
      // Verificar que la cuenta tiene saldo suficiente
      const accountInfo = await stellarKit.getAccountInfo(publicKey);
      
      if (!accountInfo) {
        return {
          success: false,
          message: 'No se pudo encontrar tu cuenta. Es posible que no esté activada en la red Stellar.'
        };
      }
      
      const balance = parseFloat(accountInfo.balance || '0');
      const amountToSend = parseFloat(amount);
      
      // Verificar que hay saldo suficiente (considerando la reserva mínima de 1 XLM)
      if (balance - amountToSend < 1) {
        return {
          success: false,
          message: `No tienes saldo suficiente para realizar este pago. Tu saldo actual es de ${balance} XLM y necesitas mantener al menos 1 XLM como reserva.`
        };
      }
      
      // Realizar el pago
      const paymentResult = await stellarKit.sendPayment(
        privateKey,
        recipient,
        amount.toString(),
        { memo: 'Pago desde GuardWallet' }
      );
      
      // Generar mensaje según el resultado
      return await this.generatePaymentResponseMessage(paymentResult, amount, recipient);
    } catch (error: any) {
      console.error('Error al enviar pago:', error);
      return {
        success: false,
        message: 'Lo siento, no pude procesar el pago en este momento. Por favor, intenta más tarde.'
      };
    }
  }
  
  /**
   * Procesa la intención de creación de cuenta
   */
  private static async processCreateAccount(
    stellarKit: typeof StellarWalletKit,
    privateKey: string,
    params: Record<string, any>
  ) {
    try {
      // Verificar que tenemos los parámetros necesarios
      const { recipient, amount } = params;
      const startingBalance = amount || '1'; // Si no se especifica, usar 1 XLM como balance inicial
      
      if (!recipient) {
        return {
          success: false,
          message: 'No se especificó una dirección para la nueva cuenta.'
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
          La cuenta se ha creado exitosamente con un balance inicial de ${startingBalance} XLM.
          La dirección de la nueva cuenta es ${recipient}.
          
          Genera una respuesta amigable y profesional informando al usuario sobre la creación exitosa de la cuenta.
          Incluye la dirección y el balance inicial, pero usa un tono conversacional.
        `);
        
        const chain = promptTemplate.pipe(llm);
        const response = await chain.invoke({});
        
        return {
          success: true,
          message: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
          data: { hash: result.hash }
        };
      } else {
        return {
          success: false,
          message: 'No se pudo crear la cuenta. Por favor, verifica la dirección e intenta nuevamente.'
        };
      }
    } catch (error: any) {
      console.error('Error al crear cuenta:', error);
      return {
        success: false,
        message: 'Lo siento, no pude crear la cuenta en este momento. Por favor, intenta más tarde.'
      };
    }
  }
  
  /**
   * Procesa la intención de consulta de información de token
   */
  private static async processTokenInfo(
    stellarKit: typeof StellarWalletKit,
    publicKey: string,
    params: Record<string, any>
  ) {
    try {
      // Por ahora, solo devolvemos información sobre XLM
      const accountInfo = await stellarKit.getAccountInfo(publicKey);
      
      if (!accountInfo) {
        return {
          success: false,
          message: 'No se pudo encontrar la cuenta. Es posible que no esté activada en la red Stellar.'
        };
      }
      
      // Generar mensaje amigable con el LLM
      const llm = LLMService.getLLM();
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Eres un asistente financiero amigable. El usuario ha solicitado información sobre tokens en su wallet de Stellar.
        La cuenta tiene un saldo de ${accountInfo.balance} XLM (Lumen), que es el token nativo de la red Stellar.
        
        Genera una respuesta amigable y profesional informando al usuario sobre su token XLM.
        Incluye información básica sobre XLM como que es el token nativo de Stellar y se usa para pagar comisiones de transacción.
        Usa un tono conversacional y educativo.
      `);
      
      const chain = promptTemplate.pipe(llm);
      const result = await chain.invoke({});
      
      if (!accountInfo) {
        return {
          success: false,
          message: 'No se pudo encontrar la cuenta. Es posible que no esté activada en la red Stellar.'
        };
      }
      
      return {
        success: true,
        message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content),
        data: { balance: accountInfo.balance }
      };
    } catch (error: any) {
      console.error('Error al consultar información de token:', error);
      return {
        success: false,
        message: 'Lo siento, no pude obtener información sobre tus tokens en este momento. Por favor, intenta más tarde.'
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
    originalMessage?: string
  ) {
    try {
      // Obtener información de la cuenta para verificar que existe
      const accountInfo = await stellarKit.getAccountInfo(publicKey);
      
      if (!accountInfo) {
        return {
          success: false,
          message: 'No se pudo encontrar la cuenta. Es posible que no esté activada en la red Stellar.'
        };
      }
      
      // Obtener el historial de transacciones (limitado a 10 para el MVP)
      const transactionResult = await stellarKit.getTransactionHistory(publicKey, { limit: 10 });
      const transactions = transactionResult.transactions;
      
      // Si no hay transacciones, devolver un mensaje informativo
      if (!transactions || transactions.length === 0) {
        return {
          success: true,
          message: 'No se encontraron transacciones en tu historial. Cuando realices operaciones en la red Stellar, aparecerán aquí.',
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
        
        Mensaje original del usuario: ${originalMessage || "Ver mi historial de transacciones"}
        
        Aquí está el historial de las últimas transacciones de la cuenta:
        
        ${transactionsSummary}
        
        Genera una respuesta amigable y profesional resumiendo el historial de transacciones del usuario.
        Menciona cuántas transacciones hay, los tipos más comunes, y cualquier patrón interesante que notes.
        Si hay pocas transacciones, puedes describirlas brevemente.
        Usa un tono conversacional y servicial.
        
        Importante: Analiza el mensaje original del usuario para entender si está buscando algo específico en su historial
        (como transacciones recientes, pagos a cierta persona, etc.) y personaliza tu respuesta en función de eso.
      `);
      
      const chain = promptTemplate.pipe(llm);
      const result = await chain.invoke({});
      
      return {
        success: true,
        message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content),
        data: { transactions: transactions }
      };
    } catch (error: any) {
      console.error('Error al consultar historial de transacciones:', error);
      return {
        success: false,
        message: 'Lo siento, no pude obtener tu historial de transacciones en este momento. Por favor, intenta más tarde.'
      };
    }
  }
  
  /**
   * Genera un mensaje amigable para el usuario basado en el resultado del pago
   */
  private static async generatePaymentResponseMessage(
    paymentResult: PaymentResult,
    amount: string,
    recipient: string
  ) {
    const llm = LLMService.getLLM();
    
    if (paymentResult.success) {
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Eres un asistente financiero amigable. El usuario ha realizado un pago en Stellar.
        
        Detalles del pago:
        - Cantidad: ${amount} XLM
        - Destinatario: ${recipient}
        - Hash de la transacción: ${paymentResult.hash}
        
        Genera una respuesta amigable y profesional confirmando que el pago se ha realizado con éxito.
        Incluye los detalles del pago pero usa un tono conversacional.
      `);
      
      const chain = promptTemplate.pipe(llm);
      const result = await chain.invoke({});
      
      return {
        success: true,
        message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content),
        data: { hash: paymentResult.hash }
      };
    } else {
      const promptTemplate = ChatPromptTemplate.fromTemplate(`
        Eres un asistente financiero amigable. El usuario ha intentado realizar un pago en Stellar pero ha fallado.
        
        Detalles del intento de pago:
        - Cantidad: ${amount} XLM
        - Destinatario: ${recipient}
        - Error: ${paymentResult.error}
        
        Genera una respuesta amigable y profesional explicando que el pago no se ha podido realizar.
        Incluye una explicación del error en términos que un usuario no técnico pueda entender.
        Sugiere posibles soluciones o alternativas.
        Usa un tono conversacional y servicial.
      `);
      
      const chain = promptTemplate.pipe(llm);
      const result = await chain.invoke({});
      
      return {
        success: false,
        message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
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
      - Tipo de operación: ${intent}
      - Error técnico: ${error.message || 'Error desconocido'}
      
      Genera una respuesta amigable y profesional explicando que la operación no se ha podido realizar.
      Traduce el error técnico a un lenguaje que un usuario no técnico pueda entender.
      Sugiere posibles soluciones o alternativas.
      Usa un tono conversacional y servicial.
    `);
    
    const chain = promptTemplate.pipe(llm);
    const result = await chain.invoke({});
    
    return {
      success: false,
      message: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
    };
  }
}