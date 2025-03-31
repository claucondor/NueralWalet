/**
 * Handlers para operaciones relacionadas con el agente
 */

import { Request, Response } from 'express';
import { AgentService } from '../../lib/services/agent.service';
import { supabase } from '../../lib/utils/supabase';
import { LLMService } from '../../lib/services/llm.service';
import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Procesa un mensaje enviado al agente
 */
export interface CustomToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

export interface HistoryMessage {
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date | string;
}

export const processMessage = async (req: Request, res: Response) => {
  console.log('⚡ [API] Iniciando processMessage con request:', {
    messageLength: req?.body?.text?.length || 0,
    hasKeys: !!req?.body?.stellar_key_first_half && !!req?.body?.stellarPublicKey,
    customTokensCount: req?.body?.customTokens?.length || 0,
    messageHistoryCount: req?.body?.messageHistory?.length || 0,
    timestamp: new Date().toISOString()
  });
  
  try {
    const { text, stellar_key_first_half, stellarPublicKey, customTokens, messageHistory } = req.body;
    
    if (!text || !stellar_key_first_half || !stellarPublicKey) {
      console.log('❌ [API] Error de validación: campos requeridos faltantes');
      return res.status(400).json({
        success: false,
        error: 'Se requiere texto del mensaje, mitad de clave privada y clave pública de Stellar'
      });
    }
    
    if (customTokens && !Array.isArray(customTokens)) {
      console.log('❌ [API] Error de validación: customTokens no es un array');
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
        console.log('❌ [API] Tokens inválidos recibidos:', invalidTokens);
        return res.status(400).json({
          success: false,
          error: 'Los custom tokens deben tener symbol, name, address y decimals'
        });
      }
    }
    
    // Validar historial de mensajes si existe
    let validMessageHistory: HistoryMessage[] = [];
    if (messageHistory && Array.isArray(messageHistory)) {
      console.log(`✅ [API] Historial de mensajes recibido: ${messageHistory.length} mensajes`);
      validMessageHistory = messageHistory
        .filter((msg: any) => msg && typeof msg.content === 'string' && ['user', 'bot'].includes(msg.sender))
        .slice(0, 10); // Limitar a 10 mensajes máximo
    }
    
    console.log(`✅ [API] Validación completada para mensaje de ${text.length} caracteres`);
    
    // Buscar la otra mitad de la clave en Supabase
    console.log(`🔍 [API] Buscando mitad de clave para dirección: ${stellarPublicKey}`);
    const { data, error } = await supabase
      .from('users')
      .select('stellar_key_half')
      .eq('address', stellarPublicKey)
      .single();
    
    if (error || !data?.stellar_key_half) {
      console.error('❌ [API] Error obteniendo la otra mitad de la clave:', error);
      return res.status(500).json({
        success: false,
        error: 'Error obteniendo la otra mitad de la clave'
      });
    }
    
    console.log('✅ [API] Recuperada mitad de clave de Supabase correctamente');
    
    // Reconstruir la clave completa
    const fullPrivateKey = stellar_key_first_half + data.stellar_key_half;
    
    // Crear el contexto de conversación para el análisis de intención
    let conversationContext = '';
    if (validMessageHistory.length > 0) {
      // Formateamos el historial para el LLM
      conversationContext = 'Historial de la conversación:\n\n';
      validMessageHistory.forEach((msg: HistoryMessage) => {
        conversationContext += `${msg.sender === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}\n\n`;
      });
      
      conversationContext += 'Mensaje actual del usuario: ' + text;
      console.log(`🧠 [API] Contexto de conversación creado con ${validMessageHistory.length} mensajes anteriores`);
    }
    
    // Iniciar procesamiento en paralelo
    console.log('🔄 [API] Iniciando análisis de intención del usuario...');
    console.time('analyzeUserIntent');
    const userIntentPromise = AgentService.analyzeUserIntent(
      text, 
      customTokens, 
      conversationContext || undefined
    );
    
    // Esperar a que se complete el análisis de intención
    const userIntent = await userIntentPromise;
    console.timeEnd('analyzeUserIntent');
    console.log(`✅ [API] Análisis completado. Intención detectada: ${userIntent.intentType} con confianza: ${userIntent.confidence}`);
    
    // Verificar si faltan parámetros necesarios para la intención
    if (userIntent.intentType === 'send_payment') {
      const missingParams = [];
      
      if (!userIntent.params.recipient && !userIntent.params.recipientEmail) {
        missingParams.push('destinatario');
      }
      
      if (!userIntent.params.amount) {
        missingParams.push('cantidad');
      }
      
      // Si faltan parámetros importantes, devolver una respuesta solicitando la información
      if (missingParams.length > 0) {
        console.log(`⚠️ [API] Faltan parámetros necesarios: ${missingParams.join(', ')}`);
        
        // Generar respuesta pidiendo la información faltante usando LLM
        const llm = LLMService.getLLM();
        const promptTemplate = ChatPromptTemplate.fromTemplate(`
          Eres un asistente financiero de una aplicación de wallet.
          
          Mensaje original del usuario: {originalMessage}
          
          Información faltante: {missingParams}
          
          Genera una respuesta solicitando la información faltante de manera clara.
          Responde en el mismo idioma que el usuario utilizó en su mensaje.
          
          IMPORTANTE: Tu respuesta debe ser EXACTAMENTE el mensaje para el usuario, sin añadir frases introductorias, 
          sin comillas, sin explicaciones adicionales. Escribe como si tú fueras directamente la aplicación.
          
          NOTA: Para enviar dinero sólo se puede utilizar una dirección Stellar o un correo electrónico registrado.
        `);
        
        const chain = promptTemplate.pipe(llm);
        const result = await chain.invoke({
          originalMessage: text,
          missingParams: missingParams.join(', ')
        });
        
        const responseMessage = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
        
        return res.json({
          success: true,
          data: {
            intent: userIntent.intentType,
            confidence: userIntent.confidence,
            params: userIntent.params,
            suggestedResponse: responseMessage,
            needsMoreInfo: true,
            missingParams
          }
        });
      }
    }
    
    // Procesar la intención del usuario si tiene suficiente confianza
    if (AgentService.hasConfidence(userIntent)) {
      console.log(`🔄 [API] Procesando intención ${userIntent.intentType} con parámetros:`, userIntent.params);
      console.time('processIntent');
      
      // Ya no es necesario pasar los customTokens porque la información necesaria ya está en userIntent.params
      const processResult = await AgentService.processIntent(
        userIntent.intentType,
        userIntent.params,
        fullPrivateKey,
        stellarPublicKey,
        userIntent.originalMessage,
        userIntent.language // Pasar el idioma detectado al método processIntent
      );
      
      console.timeEnd('processIntent');
      console.log(`✅ [API] Procesamiento completado. Éxito: ${processResult.success}`);
      
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
      console.log(`ℹ️ [API] Confianza insuficiente (${userIntent.confidence}). No se procesará la intención.`);
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
    console.error('❌ [API] Error en processMessage:', error);
    console.error('❌ [API] Stack trace:', error.stack);
    
    // Usar LLM para generar un mensaje de error amigable
    console.log('🔄 [API] Generando mensaje de error amigable...');
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
    console.log('🔄 [API] Iniciando generación de mensaje de error con LLM');
    const llm = LLMService.getLLM();
    const result = await llm.invoke(
      `Eres un asistente financiero de una aplicación de wallet.
      
      Genera un mensaje de error claro y útil en el idioma apropiado.
      Explica que ocurrió un error y sugiere intentar más tarde.
      
      Tu respuesta debe ser EXACTAMENTE el mensaje para el usuario, sin añadir frases introductorias, 
      sin comillas, sin explicaciones adicionales. Escribe como si tú fueras directamente la aplicación.
      
      Detalles técnicos (solo para referencia): ${errorDetails}`
    );
    
    console.log('✅ [API] Mensaje de error generado correctamente');
    return typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
  } catch (e) {
    console.error('❌ [API] Error al generar mensaje con LLM:', e);
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