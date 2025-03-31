/**
 * Handlers para operaciones relacionadas con el agente
 */

import { Request, Response } from 'express';
import { AgentService } from '../../lib/services/agent.service';
import { supabase } from '../../lib/utils/supabase';
import { LLMService } from '../../lib/services/llm.service';

/**
 * Procesa un mensaje enviado al agente
 */
export interface CustomToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

export const processMessage = async (req: Request, res: Response) => {
  try {
    const { text, stellar_key_first_half, stellarPublicKey, customTokens } = req.body;
    
    if (!text || !stellar_key_first_half || !stellarPublicKey) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere texto del mensaje, mitad de clave privada y clave pública de Stellar'
      });
    }
    
    if (customTokens && !Array.isArray(customTokens)) {
      return res.status(400).json({
        success: false,
        error: 'customTokens debe ser un array de objetos'
      });
    }
    
    // Validar estructura de cada token si existen
    if (customTokens && customTokens.length > 0) {
      const invalidTokens = customTokens.filter((token: CustomToken) => 
        !token.symbol || !token.name || !token.address || token.decimals === undefined
      );
      
      if (invalidTokens.length > 0) {
        console.log('Tokens inválidos recibidos:', invalidTokens);
        return res.status(400).json({
          success: false,
          error: 'Los custom tokens deben tener symbol, name, address y decimals'
        });
      }
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
    
    // Iniciar procesamiento en paralelo
    const userIntentPromise = AgentService.analyzeUserIntent(text, customTokens);
    
    // Esperar a que se complete el análisis de intención
    const userIntent = await userIntentPromise;
    
    // Procesar la intención del usuario si tiene suficiente confianza
    if (AgentService.hasConfidence(userIntent)) {
      // Ya no es necesario pasar los customTokens porque la información necesaria ya está en userIntent.params
      const processResult = await AgentService.processIntent(
        userIntent.intentType,
        userIntent.params,
        fullPrivateKey,
        stellarPublicKey,
        userIntent.originalMessage,
        userIntent.language // Pasar el idioma detectado al método processIntent
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
    // Usar LLM para generar un mensaje de error amigable
    const llm = LLMService.getLLM();
    const errorMessage = await generateErrorMessage(error.message || 'Error desconocido');
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
};

/**
 * Genera un mensaje de error amigable utilizando LLM
 */
async function generateErrorMessage(errorDetails: string): Promise<string> {
  try {
    const llm = LLMService.getLLM();
    const result = await llm.invoke(
      `Eres un asistente financiero amigable. Ocurrió un error al procesar la solicitud del usuario.
      
      Genera un mensaje de error claro y útil en español o en el idioma en que el usuario escribió su mensaje si lo puedes detectar.
      Explica que ocurrió un error y sugiere intentar más tarde.
      
      Detalles técnicos (solo para referencia): ${errorDetails}`
    );
    
    return typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
  } catch (e) {
    // Si falla el LLM, devolver mensaje predeterminado
    return 'Lo siento, ocurrió un error al procesar tu solicitud. Por favor, intenta más tarde.';
  }
}

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