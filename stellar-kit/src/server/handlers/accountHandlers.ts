/**
 * Handlers for Stellar account operations
 */

import { Request, Response } from 'express';
import { StellarWalletKit } from '../../lib/services/StellarWalletKit';

// Definition of types for credit assessment response
interface CreditScoreData {
  score: number;
  reason: string;
  improvementTips: string[];
}

interface CreditResult {
  success: boolean;
  analysis?: any;
  creditScore?: CreditScoreData;
  error?: string;
}

// Initialize StellarWalletKit (using testnet by default)
const walletKit = new StellarWalletKit(true);

/**
 * Generates a new Stellar keypair
 */
export const generateKeypair = (req: Request, res: Response) => {
  try {
    const keypair = walletKit.generateKeypair();
    res.json({
      success: true,
      data: keypair
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error generating keypair'
    });
  }
};

/**
 * Gets account information
 */
export const getAccountInfo = async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params;
    
    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Public key is required'
      });
    }
    
    const accountInfo = await walletKit.getAccountInfo(publicKey);
    
    if (!accountInfo) {
      return res.status(404).json({
        success: false,
        error: 'Account not found or not activated'
      });
    }
    
    res.json({
      success: true,
      data: accountInfo
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error getting account information'
    });
  }
};

/**
 * Funds an account with friendbot (testnet)
 */
export const fundAccount = async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.body;
    
    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Public key is required'
      });
    }
    
    const result = await walletKit.fundAccountWithFriendbot(publicKey);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Error funding the account'
      });
    }
    
    res.json({
      success: true,
      data: {
        hash: result.hash
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error funding the account'
    });
  }
};

/**
 * Creates a new account on the Stellar network
 */
export const createAccount = async (req: Request, res: Response) => {
  try {
    const { sourceSecretKey, destinationPublicKey, startingBalance, memo } = req.body;
    
    if (!sourceSecretKey || !destinationPublicKey || !startingBalance) {
      return res.status(400).json({
        success: false,
        error: 'sourceSecretKey, destinationPublicKey and startingBalance are required'
      });
    }
    
    const options = memo ? { memo } : {};
    
    const result = await walletKit.createAccount(
      sourceSecretKey,
      destinationPublicKey,
      startingBalance,
      options
    );
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Error creating the account'
      });
    }
    
    res.json({
      success: true,
      data: {
        hash: result.hash
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error creating the account'
    });
  }
};

/**
 * Evaluates the credit reputation of a Stellar account
 */
export const evaluateCreditScore = async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params;
    const { language = 'en' } = req.query;
    
    console.log(`🔍 [CREDIT SCORE] Starting credit evaluation for address: ${publicKey}`);
    console.log(`🌐 [CREDIT SCORE] Requested language: ${language}`);
    
    // Verify that we are using the correct network (testnet)
    const networkType = walletKit.getNetwork();
    console.log(`🌍 [CREDIT SCORE] Stellar network used: ${networkType}`);
    
    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Public key is required'
      });
    }
    
    console.log(`⏳ [CREDIT SCORE] Getting transaction data for analysis...`);
    const creditResult = await walletKit.evaluateCreditReputation(publicKey, language as string) as CreditResult;
    
    if (!creditResult.success) {
      return res.status(400).json({
        success: false,
        error: creditResult.error || 'Error evaluating credit reputation'
      });
    }
    
    // We won't block showing the credit score based on transaction count
    // Instead, we'll always return the data and let the frontend decide how to display it
    
    // Check if we have credit score
    const score = creditResult.creditScore ? (creditResult.creditScore as any).score || 0 : 0;
    const improvementTips = creditResult.creditScore ? (creditResult.creditScore as any).improvementTips || [] : [];
    
    console.log(`🏆 [CREDIT SCORE] Calculated score: ${score}/1000`);
    
    const recommendations = Array.isArray(improvementTips) ? improvementTips.join('. ') : '';
    
    console.log(`⏳ [CREDIT SCORE] Generating English recommendation...`);
    const englishRecommendation = await generateEnglishRecommendation(
      score, 
      recommendations,
      creditResult.analysis
    );
    console.log(`✅ [CREDIT SCORE] English recommendation generated successfully`);
    
    // Build and send complete response
    console.log(`📤 [CREDIT SCORE] Sending complete response to client`);
    res.json({
      success: true,
      data: {
        ...creditResult,
        englishRecommendation
      }
    });
  } catch (error: any) {
    console.error(`❌ [CREDIT SCORE] Unhandled error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || 'Error evaluating credit reputation'
    });
  }
};

/**
 * Generates recommendations in English to improve credit score
 */
async function generateEnglishRecommendation(score: number, tips: string, analysis: any): Promise<string> {
  try {
    // Dynamically import LLMService
    const { LLMService } = await import('../../lib/services/llm.service');
    const { ChatPromptTemplate } = await import('@langchain/core/prompts');
    
    const llm = LLMService.getLLM();
    const promptTemplate = ChatPromptTemplate.fromTemplate(`
      You are a professional financial advisor specializing in credit scoring for a decentralized finance platform.
      
      USER CREDIT PROFILE:
      - Credit Score: ${score} out of 1000
      - Total transaction volume: ${analysis.totalVolume} XLM
      - Number of transactions: ${analysis.transactionCount}
      - Transaction frequency: ${analysis.frequency} per day
      - Net flow: ${analysis.netFlow} XLM
      - Largest transaction: ${analysis.largestTransaction} XLM
      - Debt/payment ratio: ${analysis.debtRatio}
      - Incoming transactions: ${analysis.incomingCount}
      - Outgoing transactions: ${analysis.outgoingCount}
      
      Original recommendations: ${tips}
      
      TASK:
      Write a professional, practical financial advice message in English that:
      1. Explains what the score means (whether it's poor, below average, average, good, or excellent)
      2. Identifies specific risk factors in the user's transaction pattern
      3. Provides 3-4 specific, actionable recommendations to improve their credit score
      4. Uses a professional but accessible tone
      
      IMPORTANT GUIDELINES:
      - Be honest about the score - for scores below 400, clearly state this is considered high-risk
      - For scores below 600, emphasize the need for significant improvement
      - Focus on specific actions the user can take based on their actual transaction patterns
      - Keep your response between 100-150 words
      - ALWAYS write in English regardless of the language of the original recommendations
    `);
    
    const chain = promptTemplate.pipe(llm);
    const result = await chain.invoke({});
    
    return typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
  } catch (error) {
    console.error('Error generating English recommendation:', error);
    return "We were unable to generate personalized recommendations at this time. To improve your credit score, consider maintaining consistent transaction activity and balancing incoming and outgoing payments.";
  }
} 