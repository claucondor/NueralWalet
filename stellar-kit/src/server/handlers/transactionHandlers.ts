/**
 * Handlers para operaciones relacionadas con transacciones
 */

import { Request, Response } from 'express';
import { StellarWalletKit } from '../../lib/services/StellarWalletKit';

// Inicializar StellarWalletKit (usamos testnet por defecto)
const walletKit = new StellarWalletKit(true);

/**
 * Realiza un pago en XLM
 */
export const sendPayment = async (req: Request, res: Response) => {
  try {
    const { sourceSecretKey, destination, amount, memo } = req.body;
    
    if (!sourceSecretKey || !destination || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren sourceSecretKey, destination y amount'
      });
    }
    
    const options = memo ? { memo } : {};
    
    const result = await walletKit.sendPayment(
      sourceSecretKey,
      destination,
      amount,
      options
    );
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Error enviando pago'
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
      error: error.message || 'Error enviando pago'
    });
  }
}; 