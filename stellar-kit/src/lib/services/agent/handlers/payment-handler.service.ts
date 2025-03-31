import { AgentResult } from '../types';
import { MessageService } from '../message.service';
import StellarWalletKit from '../../..';
import { MINIMUM_XLM_RESERVE, DEFAULT_PAYMENT_MEMO } from '../constants';
import { PaymentResult } from '../../../interfaces/wallet.interface';

/**
 * Service for handling payment operations
 */
export class PaymentHandlerService {
  /**
   * Processes payment sending intent
   * @param stellarKit Stellar Kit
   * @param privateKey Stellar private key
   * @param publicKey Stellar public key
   * @param params Payment parameters
   * @param language Response language
   * @returns Operation result
   */
  static async processSendPayment(
    stellarKit: typeof StellarWalletKit,
    privateKey: string,
    publicKey: string,
    params: Record<string, any>,
    language: string
  ): Promise<AgentResult> {
    // Check if it's a Soroban token
    const isSorobanToken = params.tokenAddress && !params.isNativeToken;
    
    if (isSorobanToken) {
      return await this.processSorobanTokenPayment(stellarKit, privateKey, params, language);
    }
    
    // Process payment with native XLM
    return await this.processNativePayment(stellarKit, privateKey, publicKey, params, language);
  }
  
  /**
   * Processes a Soroban token payment
   * @param stellarKit Stellar Kit
   * @param privateKey Stellar private key
   * @param params Payment parameters
   * @param language Response language
   * @returns Operation result
   */
  private static async processSorobanTokenPayment(
    stellarKit: typeof StellarWalletKit,
    privateKey: string,
    params: Record<string, any>,
    language: string
  ): Promise<AgentResult> {
    try {
      // Verify we have the necessary parameters
      const { recipient, amount, tokenAddress, isNativeToken } = params;
      
      if (!recipient || !amount || !tokenAddress || isNativeToken === undefined) {
        // Generate error message for missing parameters
        const errorMessage = await MessageService.generateErrorMessage(
          MessageService.templates.genericError,
          {
            language,
            error: 'Missing required parameters: recipient, amount or token address'
          }
        );
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      // Verify private key format (must be Stellar format, not VET or other)
      if (!privateKey.startsWith('S')) {
        const errorMessage = await MessageService.generateErrorMessage(
          MessageService.templates.genericError,
          {
            language,
            error: 'The private key format is not valid for Stellar'
          }
        );
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      // Perform Soroban token transfer
      const result = await stellarKit.sendToken(
        tokenAddress,
        privateKey,
        recipient,
        amount
      );
      
      if (result.success) {
        // Generate success message
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
        // Generate error message
        const errorMessage = await MessageService.generateErrorMessage(
          MessageService.templates.paymentFailed,
          {
            language,
            amount,
            recipient,
            error: result.error || 'Unknown error when sending tokens'
          }
        );
        
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Error sending Soroban token payment:', error);
      
      // Generate generic error message
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
  
  /**
   * Processes a native XLM payment
   * @param stellarKit Stellar Kit
   * @param privateKey Stellar private key
   * @param publicKey Stellar public key
   * @param params Payment parameters
   * @param language Response language
   * @returns Operation result
   */
  private static async processNativePayment(
    stellarKit: typeof StellarWalletKit,
    privateKey: string,
    publicKey: string,
    params: Record<string, any>,
    language: string
  ): Promise<AgentResult> {
    try {
      // Verify we have the necessary parameters
      const { recipient, amount } = params;
      
      // Verify recipient exists
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
      
      // Verify amount exists
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
      
      // Verify account exists
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
      
      // Check if there's enough balance
      const currentBalance = parseFloat(accountInfo.balance || '0');
      const amountToSend = parseFloat(amount);
      
      if (currentBalance < amountToSend + MINIMUM_XLM_RESERVE) {
        const errorMessage = await MessageService.generateErrorMessage(
          MessageService.templates.insufficientBalance,
          { 
            language,
            balance: currentBalance.toString(),
            minimumReserve: MINIMUM_XLM_RESERVE.toString()
          }
        );
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      // Perform native XLM payment
      const paymentResult = await stellarKit.sendPayment(
        privateKey,
        recipient,
        amount.toString(),
        { memo: DEFAULT_PAYMENT_MEMO }
      );
      
      // Return appropriate response based on payment result
      return await this.generatePaymentResponseMessage(paymentResult, amount, recipient, language);
    } catch (error: any) {
      console.error('Error sending native payment:', error);
      
      // Generate generic error message
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
  
  /**
   * Generates response message for payment operations
   * @param paymentResult Payment operation result
   * @param amount Payment amount
   * @param recipient Payment recipient
   * @param language Response language
   * @returns Formatted operation result
   */
  private static async generatePaymentResponseMessage(
    paymentResult: PaymentResult,
    amount: string,
    recipient: string,
    language: string
  ): Promise<AgentResult> {
    if (paymentResult.success) {
      // Generate success message
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
      // Generate error message
      const errorMessage = await MessageService.generateErrorMessage(
        MessageService.templates.paymentFailed,
        {
          language,
          amount,
          recipient,
          error: paymentResult.error || 'Unknown error'
        }
      );
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }
} 