import { AgentResult } from '../types';
import { MessageService } from '../message.service';
import StellarWalletKit from '../../..';

/**
 * Service for handling balance queries
 */
export class BalanceHandlerService {
  /**
   * Processes balance check intent
   * @param stellarKit Stellar Kit
   * @param publicKey Stellar public key
   * @param language Response language
   * @returns Operation result
   */
  static async processBalanceCheck(
    stellarKit: typeof StellarWalletKit, 
    publicKey: string, 
    language: string
  ): Promise<AgentResult> {
    try {
      // Get account information
      const accountInfo = await stellarKit.getAccountInfo(publicKey);
      
      if (!accountInfo) {
        // Generate error message if account doesn't exist
        const errorMessage = await MessageService.generateErrorMessage(
          MessageService.templates.accountNotFound,
          { language }
        );
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      // Generate success message with balance
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
      console.error('Error checking balance:', error);
      
      // Generate generic error message
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