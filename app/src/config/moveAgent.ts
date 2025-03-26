/**
 * Configuración para el servicio de Move Agent
 */
//esto es aptos - Move Agent Kit

// Obtener URL del entorno o usar local por defecto
//esto es aptos - Move Agent Kit
const getAgentServiceUrl = (): string => {
  if (import.meta.env.VITE_MOVE_AGENT_SERVICE_URL) {
    return import.meta.env.VITE_MOVE_AGENT_SERVICE_URL;
  }
  
  // Usar localhost en desarrollo
  return import.meta.env.DEV 
    ? 'http://localhost:3001' 
    : 'https://move-agent-service.yourproduction.com';
};

// Configuración del servicio
//esto es aptos - Move Agent Kit
export const moveAgentConfig = {
  baseUrl: getAgentServiceUrl(),
  endpoints: {
    process: '/api/agent/process',
    'process-message': '/api/agent/process-message',
    'register-with-key': '/api/user/register-with-key',
    status: '/api/status'
  },
  timeout: 30000 // Timeout en milisegundos
};

// Exportar función para obtener la URL completa para un endpoint
//esto es aptos - Move Agent Kit
export const getEndpointUrl = (endpoint: keyof typeof moveAgentConfig.endpoints): string => {
  return `${moveAgentConfig.baseUrl}${moveAgentConfig.endpoints[endpoint]}`;
}; 