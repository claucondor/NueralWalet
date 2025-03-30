/**
 * Manejadores para operaciones relacionadas con usuarios
 */

import { Request, Response } from 'express';
import { checkUserByEmail } from '../../lib/utils/supabase';

/**
 * Verificar si un email existe en la base de datos
 * @param req Request con el email como parámetro
 * @param res Response
 */
export const checkEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email no proporcionado',
        message: 'Se requiere un email para verificar'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de email inválido',
        message: 'El email proporcionado no tiene un formato válido'
      });
    }

    // Verificar si el email existe en Supabase
    const result = await checkUserByEmail(email);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: 'Error al verificar el email',
        message: result.error
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        exists: result.exists
      }
    });
  } catch (error: any) {
    console.error('Error en checkEmail:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message || 'Algo salió mal al verificar el email'
    });
  }
};

/**
 * Obtener el estado del servicio
 * @param req Request
 * @param res Response
 */
export const getStatus = (req: Request, res: Response) => {
  try {
    // Información básica del estado del servicio
    const status = {
      service: 'GuardWallet API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('Error en getStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message || 'Algo salió mal al obtener el estado del servicio'
    });
  }
};