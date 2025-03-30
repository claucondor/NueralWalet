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
    const { text, stellar_key_first_half, stellarPublicKey } = req.body;
    
    if (!text || !stellar_key_first_half || !stellarPublicKey) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere texto del mensaje, mitad de clave privada y clave pública de Stellar'
      });
    }
    
    // Buscar la otra mitad de la clave en Supabase
    const { data, error } = await supabase
      .from('users')
      .select('stellar_key_half')
      .eq('address', stellarPublicKey)
      .single();
    
    if (error || !data?.stellar_key_half) {
      console.error('Error obteniendo la otra mitad de la clave:', error);
      return res.status(500).json({
        success: false,
        error: 'Error obteniendo la otra mitad de la clave'
      });
    }
    
    // Reconstruir la clave completa
    const fullPrivateKey = stellar_key_first_half + data.stellar_key_half;
    //console.log('Clave privada completa reconstruida:', fullPrivateKey);
    
    // Analizar la intención del usuario utilizando el servicio de agente
    const userIntent = await AgentService.analyzeUserIntent(text);
    
    // Procesar la intención del usuario si tiene suficiente confianza
    if (AgentService.hasConfidence(userIntent)) {
      // Procesar la intención utilizando la clave privada reconstruida
      const processResult = await AgentService.processIntent(
        userIntent.intentType,
        userIntent.params,
        fullPrivateKey,
        stellarPublicKey
      );
      
      // Devolver el resultado del procesamiento
      return res.json({
        success: processResult.success,
        data: {
          intent: userIntent.intentType,
          confidence: userIntent.confidence,
          params: userIntent.params,
          suggestedResponse: processResult.message,
          ...processResult.data && { transactionData: processResult.data }
        }
      });
    } else {
      // Si no hay suficiente confianza, devolver solo la intención detectada
      return res.json({
        success: true,
        data: {
          intent: userIntent.intentType,
          confidence: userIntent.confidence,
          params: userIntent.params,
          suggestedResponse: userIntent.suggestedResponse || 'No estoy seguro de entender tu solicitud. ¿Podrías ser más específico?'
        }
      });
    }
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