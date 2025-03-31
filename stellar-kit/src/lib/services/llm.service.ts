import { ChatOpenAI } from '@langchain/openai';

/**
 * Servicio que proporciona acceso a modelos de lenguaje a través de OpenRouter
 */
export class LLMService {
  /**
   * Obtiene una instancia configurada de ChatOpenAI para interactuar con OpenRouter
   * @returns Instancia de ChatOpenAI configurada
   */
  static getLLM(): ChatOpenAI {
    return new ChatOpenAI({
      temperature: 0.7,
      modelName: process.env.MODEL_NAME || 'openrouter/anthropic/claude-3-opus-20240229',
      openAIApiKey: process.env.OPENROUTER_API_KEY as string,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1'
      },
      timeout: 25000, // 25 segundos de timeout
      maxRetries: 2,
      maxConcurrency: 5 // Limitar concurrencia para evitar sobrecarga
    });
  }
}