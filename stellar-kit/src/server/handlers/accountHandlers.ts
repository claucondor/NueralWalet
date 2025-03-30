/**
 * Handlers para operaciones relacionadas con cuentas Stellar
 */

import { Request, Response } from 'express';
import { StellarWalletKit } from '../../lib/services/StellarWalletKit';

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