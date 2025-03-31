/**
 * Handlers para operaciones relacionadas con cuentas Stellar
 */

import { Request, Response } from 'express';
import { StellarWalletKit } from '../../lib/services/StellarWalletKit';

// Definición de tipos para la respuesta de evaluación crediticia
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

// Inicializar StellarWalletKit (usamos testnet por defecto)
const walletKit = new StellarWalletKit(true);

/**
 * Genera un nuevo par de claves Stellar
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
      error: error.message || 'Error generando keypair'
    });
  }
};

/**
 * Obtiene información de una cuenta
 */
export const getAccountInfo = async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params;
    
    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere una clave pública'
      });
    }
    
    const accountInfo = await walletKit.getAccountInfo(publicKey);
    
    if (!accountInfo) {
      return res.status(404).json({
        success: false,
        error: 'Cuenta no encontrada o no activada'
      });
    }
    
    res.json({
      success: true,
      data: accountInfo
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error obteniendo información de la cuenta'
    });
  }
};

/**
 * Fondea una cuenta con friendbot (testnet)
 */
export const fundAccount = async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.body;
    
    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere una clave pública'
      });
    }
    
    const result = await walletKit.fundAccountWithFriendbot(publicKey);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Error fondeando la cuenta'
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
      error: error.message || 'Error fondeando la cuenta'
    });
  }
};

/**
 * Crea una nueva cuenta en la red Stellar
 */
export const createAccount = async (req: Request, res: Response) => {
  try {
    const { sourceSecretKey, destinationPublicKey, startingBalance, memo } = req.body;
    
    if (!sourceSecretKey || !destinationPublicKey || !startingBalance) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren sourceSecretKey, destinationPublicKey y startingBalance'
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
        error: result.error || 'Error creando la cuenta'
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
      error: error.message || 'Error creando la cuenta'
    });
  }
};

/**
 * Evalúa la reputación crediticia de una cuenta Stellar
 */
export const evaluateCreditScore = async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params;
    const { language = 'es' } = req.query;
    
    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere una clave pública'
      });
    }
    
    const creditResult = await walletKit.evaluateCreditReputation(publicKey, language as string) as CreditResult;
    
    if (!creditResult.success) {
      return res.status(400).json({
        success: false,
        error: creditResult.error || 'Error evaluando reputación crediticia'
      });
    }
    
    // Generar mensaje de recomendación en inglés independientemente del idioma del score
    const score = creditResult.creditScore ? (creditResult.creditScore as any).score || 0 : 0;
    const improvementTips = creditResult.creditScore ? (creditResult.creditScore as any).improvementTips || [] : [];
    const recommendations = Array.isArray(improvementTips) ? improvementTips.join('. ') : '';
    
    const englishRecommendation = await generateEnglishRecommendation(
      score, 
      recommendations,
      creditResult.analysis
    );
    
    res.json({
      success: true,
      data: {
        ...creditResult,
        englishRecommendation
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error evaluando reputación crediticia'
    });
  }
};

/**
 * Genera recomendaciones en inglés para mejorar el score crediticio
 */
async function generateEnglishRecommendation(score: number, tips: string, analysis: any): Promise<string> {
  try {
    // Importar LLMService de forma dinámica
    const { LLMService } = await import('../../lib/services/llm.service');
    const { ChatPromptTemplate } = await import('@langchain/core/prompts');
    
    const llm = LLMService.getLLM();
    const promptTemplate = ChatPromptTemplate.fromTemplate(`
      You're a financial advisor specializing in credit scoring for a decentralized finance platform.
      
      A user has received a credit score of ${score} out of 1000.
      
      Original recommendations (may be in Spanish or other language): ${tips}
      
      Transaction analysis data:
      - Total volume: ${analysis.totalVolume} XLM
      - Number of transactions: ${analysis.transactionCount}
      - Transaction frequency: ${analysis.frequency} per day
      - Net flow: ${analysis.netFlow} XLM
      - Largest transaction: ${analysis.largestTransaction} XLM
      - Debt ratio: ${analysis.debtRatio}
      
      Based on this information, write a personalized, supportive message in English that:
      1. Explains what the score means in context (whether it's good, average, or needs improvement)
      2. Provides 2-3 specific, actionable recommendations to improve their credit score
      3. Encourages positive financial behavior
      
      Keep your response under 120 words, professional but conversational, and focus on practical advice.
    `);
    
    const chain = promptTemplate.pipe(llm);
    const result = await chain.invoke({});
    
    return typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
  } catch (error) {
    console.error('Error generando recomendación en inglés:', error);
    return "We were unable to generate personalized recommendations at this time. To improve your credit score, consider maintaining consistent transaction activity and balancing incoming and outgoing payments.";
  }
} 