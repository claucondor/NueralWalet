/**
 * Handlers para operaciones relacionadas con el agente
 */

import { Request, Response } from 'express';
import { AgentService } from '../../lib/services/agent.service';
import { supabase } from '../../lib/utils/supabase';

/**
 * Procesa un mensaje enviado al agente
 */
export const processMessage = async (req: Request, res: Response) => {
  try {
    const { text, privateKeyHalf, stellarPublicKey } = req.body;
    
    if (!text || !privateKeyHalf || !stellarPublicKey) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere texto del mensaje, mitad de clave privada y clave pública de Stellar'
      });
    }
    
    // Buscar la otra mitad de la clave en Supabase
    const { data, error } = await supabase
      .from('users')
      .select('private_key_half')
      .eq('address', stellarPublicKey)
      .single();
    
    if (error || !data?.private_key_half) {
      console.error('Error obteniendo la otra mitad de la clave:', error);
      return res.status(500).json({
        success: false,
        error: 'Error obteniendo la otra mitad de la clave'
      });
    }
    
    // Reconstruir la clave completa
    const fullPrivateKey = privateKeyHalf + data.private_key_half;
    console.log('Clave privada completa reconstruida:', fullPrivateKey);
    
    // Analizar la intención del usuario utilizando el servicio de agente
    const userIntent = await AgentService.analyzeUserIntent(text);
    
    // Devolver la intención detectada y los parámetros
    res.json({
      success: true,
      data: {
        intent: userIntent.intentType,
        confidence: userIntent.confidence,
        params: userIntent.params,
        suggestedResponse: userIntent.suggestedResponse
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error procesando el mensaje'
    });
  }
};

/**
 * Verifica el estado del agente
 */
export const getAgentStatus = async (req: Request, res: Response) => {
  try {
    // Por ahora, simplemente devolvemos un estado activo
    // En el futuro, aquí se implementará la verificación real del estado del agente
    res.json({
      success: true,
      data: {
        status: 'active',
        message: 'El agente está funcionando correctamente'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error obteniendo el estado del agente'
    });
  }
};