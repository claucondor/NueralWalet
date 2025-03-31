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
    
    console.log(`🔍 [CREDIT SCORE] Iniciando evaluación crediticia para la dirección: ${publicKey}`);
    console.log(`🌐 [CREDIT SCORE] Idioma solicitado: ${language}`);
    
    // Verificar que estamos usando la red correcta (testnet)
    const networkType = walletKit.getNetwork();
    console.log(`🌍 [CREDIT SCORE] Red Stellar utilizada: ${networkType}`);
    
    if (networkType !== 'testnet') {
      console.warn(`⚠️ [CREDIT SCORE] ADVERTENCIA: No estás usando la testnet de Stellar. Cambia a testnet para pruebas.`);
    }
    
    if (!publicKey) {
      console.error(`❌ [CREDIT SCORE] Error: No se proporcionó una clave pública`);
      return res.status(400).json({
        success: false,
        error: 'Se requiere una clave pública'
      });
    }
    
    console.log(`⏳ [CREDIT SCORE] Obteniendo datos de transacciones para análisis...`);
    const creditResult = await walletKit.evaluateCreditReputation(publicKey, language as string) as CreditResult;
    console.log(`✅ [CREDIT SCORE] Proceso de evaluación completado con éxito: ${creditResult.success}`);
    
    if (!creditResult.success) {
      console.error(`❌ [CREDIT SCORE] Error en evaluación: ${creditResult.error}`);
      return res.status(400).json({
        success: false,
        error: creditResult.error || 'Error evaluando reputación crediticia'
      });
    }
    
    // Verificar si tenemos datos de análisis
    if (creditResult.analysis) {
      console.log(`📊 [CREDIT SCORE] Estadísticas: Volumen total=${creditResult.analysis.totalVolume} XLM, Transacciones=${creditResult.analysis.transactionCount}, Frecuencia=${creditResult.analysis.frequency}/día`);
    } else {
      console.warn(`⚠️ [CREDIT SCORE] No se obtuvo análisis de transacciones`);
    }
    
    // Verificar si tenemos score crediticio
    const score = creditResult.creditScore ? (creditResult.creditScore as any).score || 0 : 0;
    const improvementTips = creditResult.creditScore ? (creditResult.creditScore as any).improvementTips || [] : [];
    
    console.log(`🏆 [CREDIT SCORE] Score calculado: ${score}/1000`);
    console.log(`💡 [CREDIT SCORE] Consejos de mejora: ${improvementTips.length}`);
    
    const recommendations = Array.isArray(improvementTips) ? improvementTips.join('. ') : '';
    
    console.log(`⏳ [CREDIT SCORE] Generando recomendación en inglés...`);
    const englishRecommendation = await generateEnglishRecommendation(
      score, 
      recommendations,
      creditResult.analysis
    );
    console.log(`✅ [CREDIT SCORE] Recomendación en inglés generada correctamente`);
    
    // Construir y enviar respuesta completa
    console.log(`📤 [CREDIT SCORE] Enviando respuesta completa al cliente`);
    res.json({
      success: true,
      data: {
        ...creditResult,
        englishRecommendation
      }
    });
  } catch (error: any) {
    console.error(`❌ [CREDIT SCORE] Error no controlado: ${error.message}`);
    console.error('Stack trace:', error.stack);
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