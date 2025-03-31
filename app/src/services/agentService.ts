import axios from 'axios';

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 segundo
const TIMEOUT = 60000; // 60 segundos (aumentado de 30s)
const MAX_HISTORY_MESSAGES = 10; // Máximo número de mensajes del historial a enviar

// Función para esperar un tiempo determinado
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Interfaz para mensajes en el historial
interface HistoryMessage {
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date | string;
}

const agentService = {
  // Mantener un historial de mensajes en memoria
  messageHistory: [] as HistoryMessage[],

  // Añadir mensaje al historial
  addToHistory: (message: string, sender: 'user' | 'bot') => {
    const historyMessage: HistoryMessage = {
      content: message,
      sender,
      timestamp: new Date()
    };
    
    // Añadir al inicio para que los más recientes estén primero
    agentService.messageHistory.unshift(historyMessage);
    
    // Mantener solo los últimos N mensajes
    if (agentService.messageHistory.length > MAX_HISTORY_MESSAGES) {
      agentService.messageHistory.pop();
    }
    
    // Opcional: guardar en localStorage para persistencia entre sesiones
    localStorage.setItem('chatMessageHistory', JSON.stringify(agentService.messageHistory));
  },

  // Cargar historial desde localStorage al iniciar
  loadHistory: () => {
    try {
      const savedHistory = localStorage.getItem('chatMessageHistory');
      if (savedHistory) {
        agentService.messageHistory = JSON.parse(savedHistory);
      }
    } catch (error) {
      console.error('Error al cargar historial de mensajes:', error);
      // Si hay error, iniciar con historial vacío
      agentService.messageHistory = [];
    }
  },

  processMessage: async (message: string, stellar_key_first_half: string, stellarPublicKey: string, customTokens?: any[]) => {
    // Añadir mensaje del usuario al historial
    agentService.addToHistory(message, 'user');
    
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
        console.log(`Enviando solicitud a ${apiUrl}... (timeout: ${TIMEOUT}ms)`);
        console.log(`Tamaño del mensaje: ${message.length} caracteres`);
        console.log(`Enviando ${agentService.messageHistory.length} mensajes de historial`);
        console.time('api_process_message');
        
        const response = await axios.post(
          apiUrl,
          { 
            text: message, 
            stellar_key_first_half, 
            stellarPublicKey, 
            customTokens,
            messageHistory: agentService.messageHistory 
          },
          { timeout: TIMEOUT } // timeout aumentado a 60 segundos
        );
        
        console.timeEnd('api_process_message');
        console.log('Respuesta recibida:', response.status, 'Tamaño:', response.data ? JSON.stringify(response.data).length : 0, 'bytes');
        
        // Si la respuesta fue exitosa, añadirla al historial
        if (response.data.success && response.data.data?.suggestedResponse) {
          agentService.addToHistory(response.data.data.suggestedResponse, 'bot');
        }
        
        return response.data;
      } catch (error: any) {
        console.timeEnd('api_process_message'); // Asegurarse de finalizar el timer incluso en error
        retries++;
        console.error(`Error processing message (intento ${retries}/${MAX_RETRIES + 1}):`, error.message);
        
        // Detalles adicionales sobre el error
        if (error.code === 'ECONNABORTED') {
          console.error('Error de timeout - La solicitud tardó demasiado tiempo');
          return {
            success: false,
            message: 'La solicitud tomó demasiado tiempo en procesarse. Puede que tu consulta sea demasiado compleja o el servidor esté ocupado. Por favor, intenta una consulta más simple o inténtalo de nuevo más tarde.'
          };
        }
        
        if (error.response) {
          // La solicitud fue hecha y el servidor respondió con un código de estado
          // que cae fuera del rango de 2xx
          console.error('Error de respuesta:', error.response.status, error.response.data);
          console.error('Headers de respuesta:', JSON.stringify(error.response.headers));
          
          // Si es un error 4xx (excepto 429), no reintentar
          if (error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
            return {
              success: false,
              message: error.response.data?.error || 'Error en la solicitud. Por favor verifica los datos e intenta de nuevo.'
            };
          }
        } else if (error.request) {
          // La solicitud fue hecha pero no se recibió respuesta
          console.error('No se recibió respuesta del servidor:', error.request);
          if (retries > MAX_RETRIES) {
            return {
              success: false,
              message: 'El servidor no respondió a tu solicitud. Por favor, verifica tu conexión a internet e inténtalo de nuevo más tarde.'
            };
          }
        } else {
          // Algo ocurrió al configurar la solicitud que desencadenó un error
          console.error('Error de configuración de la solicitud:', error.message);
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

// Cargar historial al iniciar
agentService.loadHistory();

export default agentService;