import { AgentResult } from '../types';
import { MessageService } from '../message.service';
import StellarWalletKit from '../../..';

/**
 * Servicio para manejar las consultas de saldo
 */
export class BalanceHandlerService {
  /**
   * Procesa la intención de consulta de saldo
   * @param stellarKit Kit de Stellar
   * @param publicKey Clave pública de Stellar
   * @param language Idioma para la respuesta
   * @returns Resultado de la operación
   */
  static async processBalanceCheck(
    stellarKit: typeof StellarWalletKit, 
    publicKey: string, 
    language: string
  ): Promise<AgentResult> {
    try {
      // Obtener información de la cuenta
      const accountInfo = await stellarKit.getAccountInfo(publicKey);
      
      if (!accountInfo) {
        // Generar mensaje de error si la cuenta no existe
        const errorMessage = await MessageService.generateErrorMessage(
          MessageService.templates.accountNotFound,
          { language }
        );
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      // Generar mensaje de éxito con el saldo
      const successMessage = await MessageService.generateSuccessMessage(
        MessageService.templates.balanceSuccess,
        { 
          language,
          balance: accountInfo.balance
        }
      );
      
      return {
        success: true,
        message: successMessage,
        data: { balance: accountInfo.balance }
      };
    } catch (error: any) {
      console.error('Error al consultar saldo:', error);
      
      // Generar mensaje de error genérico
      const errorMessage = await MessageService.generateErrorMessage(
        MessageService.templates.genericError,
        { 
          language,
          error: error.message
        }
      );
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }
} 