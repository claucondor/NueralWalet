import axios from 'axios';

const agentService = {
  processMessage: async (message: string, stellar_key_first_half: string, stellarPublicKey: string) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_MOVE_AGENT_SERVICE_URL}/process-message`,
        { text: message, stellar_key_first_half, stellarPublicKey }
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
        `${import.meta.env.VITE_MOVE_AGENT_SERVICE_URL}/status`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting agent status:', error);
      throw error;
    }
  }
};

export default agentService;