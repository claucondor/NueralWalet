import axios from 'axios';

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 segundo

// Función para esperar un tiempo determinado
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const agentService = {
  processMessage: async (message: string, stellar_key_first_half: string, stellarPublicKey: string, customTokens?: any[]) => {
    let retries = 0;
    
    while (retries <= MAX_RETRIES) {
      try {
        // Verificar primero si el servicio está disponible
        const statusCheck = await agentService.getStatus();
        if (!statusCheck.success) {
          console.warn('El servicio de agente no está disponible:', statusCheck.message);
          return {
            success: false,
            message: 'Lo siento, el servicio no está disponible en este momento. Por favor, inténtalo de nuevo más tarde.'
          };
        }
        
        // Si pasó la verificación, intentar procesar el mensaje
        const apiUrl = `${import.meta.env.VITE_STELLARKIT_API_URL || 'http://localhost:3000'}/api/agent/process-message`;
        console.log(`Enviando solicitud a ${apiUrl}...`);
        
        const response = await axios.post(
          apiUrl,
          { text: message, stellar_key_first_half, stellarPublicKey, customTokens },
          { timeout: 30000 } // 30 segundos de timeout
        );
        
        console.log('Respuesta recibida:', response.status);
        return response.data;
      } catch (error: any) {
        retries++;
        console.error(`Error processing message (intento ${retries}/${MAX_RETRIES + 1}):`, error.message);
        
        if (error.response) {
          // La solicitud fue hecha y el servidor respondió con un código de estado
          // que cae fuera del rango de 2xx
          console.error('Error de respuesta:', error.response.status, error.response.data);
          
          // Si es un error 4xx (excepto 429), no reintentar
          if (error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
            return {
              success: false,
              message: error.response.data?.error || 'Error en la solicitud. Por favor verifica los datos e intenta de nuevo.'
            };
          }
        }
        
        // Si hemos alcanzado el máximo de reintentos, devolver error
        if (retries > MAX_RETRIES) {
          return {
            success: false,
            message: 'No se pudo procesar el mensaje después de varios intentos. Por favor, inténtalo de nuevo más tarde.'
          };
        }
        
        // Esperar antes de reintentar, con backoff exponencial
        const delay = RETRY_DELAY * Math.pow(2, retries - 1);
        console.log(`Reintentando en ${delay}ms...`);
        await wait(delay);
      }
    }
    
    // Este punto no debería alcanzarse, pero por seguridad:
    return {
      success: false,
      message: 'Error inesperado al procesar el mensaje.'
    };
  },

  getStatus: async () => {
    try {
      // Intentar primero el endpoint específico del agente
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_STELLARKIT_API_URL || 'http://localhost:3000'}/api/agent/status`,
          { timeout: 5000 } // 5 segundos de timeout
        );
        console.log('Respuesta del endpoint /api/agent/status:', response.data);
        return {
          success: true,
          data: response.data.data,
          status: response.data.data?.status || 'active'
        };
      } catch (error) {
        // Si falla, intentar con el endpoint general de estado
        console.warn('Endpoint de agente no disponible, intentando endpoint general');
        const response = await axios.get(
          `${import.meta.env.VITE_STELLARKIT_API_URL || 'http://localhost:3000'}/api/status`,
          { timeout: 5000 } // 5 segundos de timeout
        );
        console.log('Respuesta del endpoint /api/status:', response.data);
        return {
          success: true,
          data: response.data.data,
          status: response.data.data?.status || 'active'
        };
      }
    } catch (error: any) {
      console.error('Error getting agent status:', error.message);
      return {
        success: false,
        status: 'offline',
        message: 'El servicio no está disponible en este momento.'
      };
    }
  }
};

export default agentService;