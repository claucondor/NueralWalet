/**
 * Handlers directos para operaciones Stellar utilizando solo el SDK, sin dependencia de CLI
 */

import { Request, Response } from 'express';
import * as StellarSdk from '@stellar/stellar-sdk';
import fetch from 'node-fetch';

// Configuración de red (testnet)
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = StellarSdk.Networks.TESTNET;

/**
 * Genera un nuevo par de claves Stellar
 */
export const generateKeypair = (req: Request, res: Response) => {
  try {
    const keypair = StellarSdk.Keypair.random();
    res.json({
      success: true,
      data: {
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret()
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error generando keypair'
    });
  }
};

/**
 * Obtiene información de una cuenta usando el SDK directamente
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
    
    try {
      const account = await server.loadAccount(publicKey);
      
      // Obtener el balance de XLM
      const xlmBalance = account.balances.find(balance => balance.asset_type === 'native');
      const balance = xlmBalance ? xlmBalance.balance : '0';
      
      res.json({
        success: true,
        data: {
          publicKey,
          balance,
          sequence: account.sequence,
          subentryCount: account.subentry_count
        }
      });
    } catch (err) {
      // Si la cuenta no existe, devolver un mensaje adecuado
      return res.status(404).json({
        success: false,
        error: 'Cuenta no encontrada o no activada'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error obteniendo información de la cuenta'
    });
  }
};

/**
 * Fondea una cuenta con friendbot usando fetch directamente
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
    
    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
      const responseJSON = await response.json();
      
      if (response.ok) {
        return res.json({
          success: true,
          data: {
            hash: responseJSON.hash || responseJSON._links?.transaction?.href.split('/').pop()
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          error: responseJSON.detail || 'Error desconocido al fondear cuenta'
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Error al conectar con friendbot'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error fondeando la cuenta'
    });
  }
};

/**
 * Realiza una transacción usando el SDK directamente
 */
export const sendPayment = async (req: Request, res: Response) => {
  try {
    const { sourceSecretKey, destinationAddress, amount, memo } = req.body;
    
    if (!sourceSecretKey || !destinationAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren sourceSecretKey, destinationAddress y amount'
      });
    }
    
    try {
      // Crear un keypair desde la clave secreta
      const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecretKey);
      
      // Cargar la cuenta del remitente
      const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
      
      // Crear la transacción
      let transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: networkPassphrase
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: destinationAddress,
            asset: StellarSdk.Asset.native(),
            amount: amount.toString()
          })
        )
        .setTimeout(30); // 30 segundos de timeout
      
      // Agregar memo si se proporciona
      if (memo) {
        transaction = transaction.addMemo(StellarSdk.Memo.text(memo));
      }
      
      // Construir la transacción
      const builtTransaction = transaction.build();
      
      // Firmar la transacción
      builtTransaction.sign(sourceKeypair);
      
      // Enviar la transacción
      const transactionResult = await server.submitTransaction(builtTransaction);
      
      return res.json({
        success: true,
        data: {
          hash: transactionResult.hash
        }
      });
    } catch (err: any) {
      console.error('Error en transacción:', err);
      
      // Extraer mensaje de error más detallado si está disponible
      let errorMessage = err.message;
      
      if (err.response && err.response.data && err.response.data.extras) {
        const extras = err.response.data.extras;
        if (extras.result_codes && extras.result_codes.operations) {
          errorMessage = `Error: ${extras.result_codes.operations.join(', ')}`;
        }
      }
      
      return res.status(400).json({
        success: false,
        error: errorMessage
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error enviando el pago'
    });
  }
};

/**
 * Obtiene información básica de un token
 * Implementación simplificada para API demo
 */
export const getTokenInfo = async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    
    if (!contractId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un ID de contrato'
      });
    }

    // Para esta demo, retornamos información simulada del token
    // En una implementación real, esto obtendría datos de la blockchain
    const tokenInfo = {
      contractId,
      name: "StellarKit Demo Token",
      symbol: "SKDT",
      decimals: 7,
      totalSupply: "1000000.0000000"
    };
    
    return res.json({
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