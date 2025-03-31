import { AgentResult } from '../types';
import { MessageService } from '../message.service';
import StellarWalletKit from '../../..';
import { MINIMUM_XLM_RESERVE, DEFAULT_PAYMENT_MEMO } from '../constants';
import { PaymentResult } from '../../../interfaces/wallet.interface';

/**
 * Servicio para manejar las operaciones de pago
 */
export class PaymentHandlerService {
  /**
   * Procesa la intención de envío de pago
   * @param stellarKit Kit de Stellar
   * @param privateKey Clave privada de Stellar
   * @param publicKey Clave pública de Stellar
   * @param params Parámetros del pago
   * @param language Idioma para la respuesta
   * @returns Resultado de la operación
   */
  static async processSendPayment(
    stellarKit: typeof StellarWalletKit,
    privateKey: string,
    publicKey: string,
    params: Record<string, any>,
    language: string
  ): Promise<AgentResult> {
    // Verificar si es un token Soroban
    const isSorobanToken = params.tokenAddress && !params.isNativeToken;
    
    if (isSorobanToken) {
      return await this.processSorobanTokenPayment(stellarKit, privateKey, params, language);
    }
    
    // Procesar pago con XLM nativo
    return await this.processNativePayment(stellarKit, privateKey, publicKey, params, language);
  }
  
  /**
   * Procesa un pago con token Soroban
   * @param stellarKit Kit de Stellar
   * @param privateKey Clave privada de Stellar
   * @param params Parámetros del pago
   * @param language Idioma para la respuesta
   * @returns Resultado de la operación
   */
  private static async processSorobanTokenPayment(
    stellarKit: typeof StellarWalletKit,
    privateKey: string,
    params: Record<string, any>,
    language: string
  ): Promise<AgentResult> {
    try {
      // Verificar que tenemos los parámetros necesarios
      const { recipient, amount, tokenAddress, isNativeToken } = params;
      
      if (!recipient || !amount || !tokenAddress || isNativeToken === undefined) {
        // Generar mensaje de error por parámetros faltantes
        const errorMessage = await MessageService.generateErrorMessage(
          MessageService.templates.genericError,
          {
            language,
            error: 'Faltan parámetros requeridos: destinatario, cantidad o dirección del token'
          }
        );
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      // Verificar formato de clave privada (debe ser formato Stellar, no VET u otro)
      if (!privateKey.startsWith('S')) {
        const errorMessage = await MessageService.generateErrorMessage(
          MessageService.templates.genericError,
          {
            language,
            error: 'El formato de la clave privada no es válido para Stellar'
          }
        );
        
        return {
          success: false,
          message: errorMessage
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
        // Generar mensaje de éxito
        const successMessage = await MessageService.generateSuccessMessage(
          MessageService.templates.paymentSuccess,
          {
            language,
            amount,
            recipient,
            hash: result.hash
          }
        );
        
        return {
          success: true,
          message: successMessage,
          data: { hash: result.hash }
        };
      } else {
        // Generar mensaje de error
        const errorMessage = await MessageService.generateErrorMessage(
          MessageService.templates.paymentFailed,
          {
            language,
            amount,
            recipient,
            error: result.error || 'Error desconocido al enviar tokens'
          }
        );
        
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error al enviar pago con token Soroban:', error);
      
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
  
  /**
   * Procesa un pago con XLM nativo
   * @param stellarKit Kit de Stellar
   * @param privateKey Clave privada de Stellar
   * @param publicKey Clave pública de Stellar
   * @param params Parámetros del pago
   * @param language Idioma para la respuesta
   * @returns Resultado de la operación
   */
  private static async processNativePayment(
    stellarKit: typeof StellarWalletKit,
    privateKey: string,
    publicKey: string,
    params: Record<string, any>,
    language: string
  ): Promise<AgentResult> {
    try {
      // Verificar que tenemos los parámetros necesarios
      const { recipient, amount } = params;
      
      // Verificar que existe un destinatario
      if (!recipient) {
        const errorMessage = await MessageService.generateErrorMessage(
          MessageService.templates.missingRecipient,
          { language }
        );
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      // Verificar que existe una cantidad
      if (!amount) {
        const errorMessage = await MessageService.generateErrorMessage(
          MessageService.templates.missingAmount,
          { language }
        );
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      // Verificar que la cuenta existe
      const accountInfo = await stellarKit.getAccountInfo(publicKey);
      
      if (!accountInfo) {
        const errorMessage = await MessageService.generateErrorMessage(
          MessageService.templates.accountNotFound,
          { language }
        );
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      // Verificar formato de clave privada (debe ser formato Stellar, no VET u otro)
      if (!privateKey.startsWith('S')) {
        const errorMessage = await MessageService.generateErrorMessage(
          MessageService.templates.genericError,
          {
            language,
            error: 'El formato de la clave privada no es válido para Stellar'
          }
        );
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      // Verificar saldo suficiente
      const balance = parseFloat(accountInfo.balance || '0');
      const amountToSend = parseFloat(amount);
      
      if (balance - amountToSend < MINIMUM_XLM_RESERVE) {
        const errorMessage = await MessageService.generateErrorMessage(
          MessageService.templates.insufficientBalance,
          {
            language,
            balance,
            minimumReserve: MINIMUM_XLM_RESERVE
          }
        );
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      // Realizar el pago
      const paymentResult = await stellarKit.sendPayment(
        privateKey,
        recipient,
        amount.toString(),
        { memo: DEFAULT_PAYMENT_MEMO }
      );
      
      // Generar mensaje según el resultado
      return await this.generatePaymentResponseMessage(paymentResult, amount, recipient, language);
    } catch (error: any) {
      console.error('Error al enviar pago nativo:', error);
      
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
  
  /**
   * Genera un mensaje de respuesta basado en el resultado del pago
   * @param paymentResult Resultado del pago
   * @param amount Cantidad enviada
   * @param recipient Destinatario
   * @param language Idioma para la respuesta
   * @returns Resultado de la operación
   */
  private static async generatePaymentResponseMessage(
    paymentResult: PaymentResult,
    amount: string,
    recipient: string,
    language: string
  ): Promise<AgentResult> {
    if (paymentResult.success) {
      // Generar mensaje de éxito
      const successMessage = await MessageService.generateSuccessMessage(
        MessageService.templates.paymentSuccess,
        {
          language,
          amount,
          recipient,
          hash: paymentResult.hash
        }
      );
      
      return {
        success: true,
        message: successMessage,
        data: { hash: paymentResult.hash }
      };
    } else {
      // Generar mensaje de error
      const errorMessage = await MessageService.generateErrorMessage(
        MessageService.templates.paymentFailed,
        {
          language,
          amount,
          recipient,
          error: paymentResult.error || 'Error desconocido'
        }
      );
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }
} 