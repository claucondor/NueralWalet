/**
 * Handlers para operaciones relacionadas con tokens
 */

import { Request, Response } from 'express';
import { StellarWalletKit } from '../../lib/services/StellarWalletKit';

// Inicializar StellarWalletKit (usamos testnet por defecto)
const walletKit = new StellarWalletKit(true);

/**
 * Obtiene la lista de tokens cargados
 */
export const getTokenList = async (req: Request, res: Response) => {
  try {
    const tokens = await walletKit.getLoadedTokens();
    res.json({
      success: true,
      data: tokens
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error obteniendo lista de tokens'
    });
  }
};

/**
 * Obtiene información de un token SEP-41
 */
export const getTokenInfo = async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    const sourceAccount = req.query.sourceAccount as string | undefined;
    
    if (!contractId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere contractId'
      });
    }
    
    const tokenInfo = await walletKit.loadToken(contractId, sourceAccount);
    
    res.json({
      success: true,
      data: tokenInfo
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error obteniendo información del token'
    });
  }
};

/**
 * Obtiene el balance de un token para una dirección
 */
export const getTokenBalance = async (req: Request, res: Response) => {
  try {
    const { contractId, address } = req.params;
    
    if (!contractId || !address) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren contractId y address'
      });
    }
    
    const balance = await walletKit.getTokenBalance(contractId, address);
    
    res.json({
      success: true,
      data: balance
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error obteniendo balance del token'
    });
  }
};

/**
 * Envía tokens de una dirección a otra
 */
export const sendToken = async (req: Request, res: Response) => {
  try {
    const { contractId, senderSecretKey, destinationPublicKey, amount } = req.body;
    
    if (!contractId || !senderSecretKey || !destinationPublicKey || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren contractId, senderSecretKey, destinationPublicKey y amount'
      });
    }
    
    const result = await walletKit.sendToken(
      contractId,
      senderSecretKey,
      destinationPublicKey,
      amount
    );
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Error enviando tokens'
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
      error: error.message || 'Error enviando tokens'
    });
  }
};

/**
 * Acuña nuevos tokens (requiere ser administrador)
 */
export const mintToken = async (req: Request, res: Response) => {
  try {
    const { contractId, adminSecretKey, toPublicKey, amount } = req.body;
    
    if (!contractId || !adminSecretKey || !toPublicKey || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren contractId, adminSecretKey, toPublicKey y amount'
      });
    }
    
    const result = await walletKit.mintToken(
      contractId,
      adminSecretKey,
      toPublicKey,
      amount
    );
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Error acuñando tokens'
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
      error: error.message || 'Error acuñando tokens'
    });
  }
};

/**
 * Quema tokens
 */
export const burnToken = async (req: Request, res: Response) => {
  try {
    const { contractId, ownerSecretKey, amount } = req.body;
    
    if (!contractId || !ownerSecretKey || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren contractId, ownerSecretKey y amount'
      });
    }
    
    const result = await walletKit.burnToken(
      contractId,
      ownerSecretKey,
      amount
    );
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Error quemando tokens'
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
      error: error.message || 'Error quemando tokens'
    });
  }
}; 