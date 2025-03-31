import axios from 'axios';

const agentService = {
  processMessage: async (message: string, stellar_key_first_half: string, stellarPublicKey: string, customTokens?: any[]) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_STELLARKIT_API_URL || 'http://localhost:3000'}/api/agent/process-message`,
        { text: message, stellar_key_first_half, stellarPublicKey, customTokens }
      );
      return response.data;
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  },

  getStatus: async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_STELLARKIT_API_URL || 'http://localhost:3000'}/api/status`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting agent status:', error);
      throw error;
    }
  }
};

export default agentService;