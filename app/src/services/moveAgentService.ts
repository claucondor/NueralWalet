/**
 * Service to interact with the Move Agent Service
 */
//esto es aptos - Move Agent Kit
import { getEndpointUrl, moveAgentConfig } from '@/config/moveAgent';

// Data types for responses
//esto es aptos - Move Agent Kit
export interface AgentResponse {
  success: boolean;
  message: string;
  data?: {
    response: {
      content: string;
    };
    processedMessage: string;
    originalMessage: string;
  };
}

// Data types for requests
//esto es aptos - Move Agent Kit
export interface AgentRequest {
  message: string;
  address?: string;
  privateKeyHalf?: string;
}

// Service to communicate with the Move Agent
//esto es aptos - Move Agent Kit
const moveAgentService = {
  /**
   * Process a message through the agent
   * @param message Message to process
   * @param address Optional wallet address
   * @param privateKeyHalf Optional private key half
   * @returns Agent response
   */
  //esto es aptos - Move Agent Kit
  async processMessage(message: string, address?: string, privateKeyHalf?: string): Promise<AgentResponse> {
    try {
      const response = await fetch(getEndpointUrl('process-message'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, address, privateKeyHalf }),
        // Configurar timeout
        signal: AbortSignal.timeout(moveAgentConfig.timeout)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing message with Move Agent:', error);
      
      // Formatear el error en el formato de respuesta esperado
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error connecting to agent'
      };
    }
  },

  /**
   * Check service status
   * @returns Service status
   */
  //esto es aptos - Move Agent Kit
  async checkStatus(): Promise<{ status: string; message: string; version: string; }> {
    try {
      const response = await fetch(getEndpointUrl('status'), {
        method: 'GET',
        // Shorter timeout for status check
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking Move Agent Service status:', error);
      return {
        status: 'error',
        message: 'Could not connect to service',
        version: 'unknown'
      };
    }
  },

  /**
   * Register the private key half for a user
   * @param email User's email
   * @param address Wallet address
   * @param privateKeyHalf Private key half to store
   * @returns Service response
   */
  //esto es aptos - Move Agent Kit
  async registerWithKey(email: string, address: string, privateKeyHalf: string): Promise<{success: boolean; message: string}> {
    try {
      const response = await fetch(getEndpointUrl('register-with-key'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, address, privateKeyHalf }),
        signal: AbortSignal.timeout(moveAgentConfig.timeout)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error registering user with key half:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error registering key'
      };
    }
  }
};

export default moveAgentService;