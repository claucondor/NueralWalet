import React, { useState, useEffect } from "react";
import { ChevronLeft, ThumbsUp, ThumbsDown, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import agentService from "@/services/agentService";
import { getAccountFromPrivateKey, useWeb3Auth } from "@/context/Web3AuthContext";
import { createDefaultAgentLimits } from "@/utils/supabase";
import { createClient } from '@supabase/supabase-js';
import ChatInput from "./ChatInput";

interface ChatScreenProps {
  onClose: () => void;
  walletAddress?: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  transactionHash?: string;
}

interface SuggestionProps {
  title: string;
  description: string;
  onClick?: () => void;
}

const ChatSuggestion: React.FC<SuggestionProps> = ({ title, description, onClick }) => (
  <div 
    className="p-6 border border-gray-200 rounded-3xl mb-4 cursor-pointer hover:bg-gray-50 transition-colors"
    onClick={onClick}
  >
    <h3 className="text-center font-bold text-lg mb-1">{title}</h3>
    <p className="text-center text-gray-400 text-base">{description}</p>
  </div>
);

const UserMessage: React.FC<{ content: string }> = ({ content }) => {
  const { userInfo } = useWeb3Auth();
  // Determinar si el contenido puede contener una transacción a partir del texto
  const mayContainTransaction = content.toLowerCase().includes('transfer') || 
                               content.toLowerCase().includes('send') || 
                               content.toLowerCase().includes('payment');
                               
  return (
    <div className="flex justify-end gap-3 p-4">
      <div className="max-w-[80%] bg-[#1E1E1E] text-white p-4 rounded-2xl rounded-tr-none">
        <p className="whitespace-pre-wrap break-words text-sm">{content}</p>
      </div>
      <Avatar className="h-10 w-10 bg-gray-300 self-start">
        {userInfo?.profileImage ? (
          <img src={userInfo.profileImage} alt="User" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
            {userInfo?.name?.charAt(0) || 'U'}
          </div>
        )}
      </Avatar>
    </div>
  );
}

// Extraer hash de transacción del mensaje si existe
const extractTransactionHash = (content: string): string | undefined => {
  // Buscar patrón que parece un hash de transacción (0x seguido de hex)
  const matches = content.match(/0x[a-fA-F0-9]{64}/);
  return matches ? matches[0] : undefined;
};

const BotMessage: React.FC<{ content: string }> = ({ content }) => {
  // Determinar si es una notificación de transacción
  const isTransactionNotification = content.includes("Successful transfer!") || 
                                   content.includes("Transaction hash");
  
  // Extraer hash de transacción si existe
  const transactionHash = extractTransactionHash(content);
  
  return (
    <div className="flex gap-3 p-4">
      <Avatar className="h-10 w-10 self-start">
        <img 
          src="/logo/logo@vector.svg" 
          alt="NeuralWallet" 
          className="h-10 w-10 rounded-full"
        />
      </Avatar>
      <div className={`max-w-[80%] p-4 rounded-2xl rounded-tl-none ${isTransactionNotification ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-[#EEEEEE] text-gray-800'}`}>
        <div className="whitespace-pre-wrap break-words text-sm">{content}</div>
        
        {transactionHash && (
          <div className="mt-2 text-xs overflow-hidden text-ellipsis">
            <a 
              href={`https://stellar.expert/explorer/testnet/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View in explorer
            </a>
          </div>
        )}
        
        <div className="flex gap-2 mt-2 justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <ThumbsUp className="h-5 w-5 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <ThumbsDown className="h-5 w-5 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full ml-4">
            <Copy className="h-5 w-5 text-gray-500" />
            <span className="sr-only">Copy to clipboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

const ChatScreen: React.FC<ChatScreenProps> = ({ onClose, walletAddress }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [hasAgentLimits, setHasAgentLimits] = useState(false);
  const { getPrivateKey } = useWeb3Auth();

  // Cargar mensajes del historial al iniciar el componente
  useEffect(() => {
    const loadMessagesFromHistory = () => {
      try {
        // Convertir el historial de mensajes en el formato que espera este componente
        const storedMessages = agentService.messageHistory.map((historyMessage, index) => ({
          id: (Date.now() - index * 1000).toString(), // Generar IDs únicos
          content: historyMessage.content,
          sender: historyMessage.sender,
          timestamp: new Date(historyMessage.timestamp)
        }));
        
        // Si hay mensajes en el historial, establecer chatStarted a true
        if (storedMessages.length > 0) {
          setChatStarted(true);
          // Invertir el orden para que se muestren cronológicamente
          setMessages(storedMessages.reverse());
        }
      } catch (error) {
        console.error('Error loading messages from history:', error);
      }
    };

    loadMessagesFromHistory();
  }, []);

  // Verificar estado del servicio y comprobar si el usuario necesita ver la pantalla de bienvenida
  useEffect(() => {
    const initChat = async () => {
      try {
        // Verificar estado del servicio
        const status = await agentService.getStatus();
        console.log('Service status:', status);
        // Verificamos el formato de respuesta correcto
        const isServiceActive = status.success && 
                               ((status.data?.status === 'active') || 
                                (status.status === 'active') || 
                                (status.data?.message && status.data.message.includes('working')));
        
        console.log('¿Service active?:', isServiceActive);
        setServiceStatus(isServiceActive ? 'online' : 'offline');
        
        // Si hay una dirección de wallet, verificar si existen límites de agente
        if (walletAddress && isServiceActive) {
          // Check if agent limits exist for this user
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const { data: existingLimits, error } = await supabase
            .from('agent_limits')
            .select('*')
            .eq('user_address', walletAddress)
            .single();
          
          if (existingLimits) {
            // El usuario ya tiene límites configurados, mostrar chat directamente
            setHasAgentLimits(true);
            setShowWelcomeScreen(false);
            console.log('Usuario ya tiene límites configurados');
          } else {
            // El usuario no tiene límites configurados, mostrar pantalla de bienvenida
            setHasAgentLimits(false);
            setShowWelcomeScreen(true);
            console.log('Usuario no tiene límites configurados, showing welcome screen');
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        setServiceStatus('offline');
      }
    };

    initChat();
  }, [walletAddress]);

  // Function to create agent limits and continue to chat
  const handleContinue = async () => {
    if (walletAddress) {
      try {
        setIsLoading(true);
        await createDefaultAgentLimits(walletAddress);
        setHasAgentLimits(true);
        setShowWelcomeScreen(false);
        console.log('Límites creados exitosamente al hacer clic en continuar');
      } catch (error) {
        console.error('Error creating agent limits:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;
    
    // Obtener tokens personalizados del localStorage
    const customTokens = JSON.parse(localStorage.getItem('customTokens') || '[]');
    
    // Verificar nuevamente si el servicio está disponible antes de enviar
    try {
      const statusCheck = await agentService.getStatus();
      const isServiceActive = statusCheck.success && 
                            ((statusCheck.data?.status === 'active') || 
                             (statusCheck.status === 'active') || 
                             (statusCheck.data?.message && statusCheck.data.message.includes('working')));
      
      if (!isServiceActive) {
        setServiceStatus('offline');
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: "Sorry, the service is not available at the moment. Please try again later.",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
      
      // Si pasamos la verificación, actualizar el estado
      if (serviceStatus !== 'online') {
        setServiceStatus('online');
      }
    } catch (error) {
      console.error('Error verifying service status:', error);
      // Continuar con el mensaje si no podemos verificar el estado
    }
    
    // Check if the service is available based on our last known state
    if (serviceStatus === 'offline') {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, the service is not available at the moment. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }
    
    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setChatStarted(true);
    setIsLoading(true);
    
    // Agregar mensaje transitorio mientras se procesa
    const processingMsgId = Date.now() + 50;
    const processingMessage: Message = {
      id: processingMsgId.toString(),
      content: "Processing your request...",
      sender: 'bot',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, processingMessage]);
    
    try {
      // Obtener la clave privada de Stellar y dividirla
      let clientHalf = '';
      if (walletAddress) {
        const privateKey = await getPrivateKey();
        if (privateKey) {
          // Generar cuenta Stellar a partir de la clave EVM
          const { stellarAccount } = getAccountFromPrivateKey(privateKey);
          if (stellarAccount && stellarAccount.secretKey.length >= 2) {
            const halfLength = Math.floor(stellarAccount.secretKey.length / 2);
            clientHalf = stellarAccount.secretKey.substring(0, halfLength); // Solo usamos la primera mitad
          }
        }
      }
      
      // Mostrar un indicador de que la solicitud está en proceso
      const updatedProcessingMessage: Message = {
        ...processingMessage,
        content: "Processing your request... This may take up to 60 seconds."
      };
      setMessages(prev => prev.map(msg => 
        msg.id === processingMsgId.toString() ? updatedProcessingMessage : msg
      ));
      
      // Llamar al servicio de Move Agent con la mitad de la clave
      const response = await agentService.processMessage(
        userMessage.content,
        clientHalf,
        walletAddress || '',
        customTokens
      );
      
      // Eliminar el mensaje transitorio
      setMessages(prev => prev.filter(msg => msg.id !== processingMsgId.toString()));
      
      if (!response.success) {
        // Si hay un error específico del API
        const botErrorMessage: Message = {
          id: (Date.now() + 100).toString(),
          content: response.message || "Could not process your request.",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botErrorMessage]);
        return;
      }
      
      // Agregar respuesta del bot
      const botMessage: Message = {
        id: (Date.now() + 100).toString(),
        content: response.data?.suggestedResponse 
          ? response.data.suggestedResponse 
          : response.data?.response?.content || "Could not process your request.",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Error processing message:', error);
      
      // Eliminar el mensaje transitorio
      setMessages(prev => prev.filter(msg => msg.id !== processingMsgId.toString()));
      
      // Determinar el tipo de error para mostrar un mensaje más específico
      let errorContent = "Sorry, an error occurred while processing your request.";
      
      if (error.code === "ECONNABORTED") {
        errorContent = "The request took too long to process. Please try with a simpler query or try again later.";
      } else if (error.message?.includes("timeout")) {
        errorContent = "The request timed out. This usually happens with complex queries. Please try with a simpler query.";
      } else if (error.response) {
        // Error with server response
        if (error.response.status === 429) {
          errorContent = "Too many requests in a short time. Please wait a moment before trying again.";
        } else if (error.response.status >= 500) {
          errorContent = "The service is experiencing problems. Please try again later.";
        } else if (error.response.data?.error) {
          errorContent = error.response.data.error;
        }
      } else if (!navigator.onLine) {
        errorContent = "It seems you don't have internet connection. Please check your connection and try again.";
      }
      
      // Agregar mensaje de error como respuesta del bot
      const errorMessage: Message = {
        id: (Date.now() + 100).toString(),
        content: errorContent,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history? This action cannot be undone.")) {
      setMessages([]);
      setChatStarted(false);
      // Limpiar el historial en el servicio también
      agentService.clearMessageHistory();
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-gray-200">
        <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h2 className="text-lg font-semibold mx-auto">NeuralWallet Agent</h2>
        <div className="flex items-center">
          {chatStarted && (
            <button 
              onClick={handleClearChat}
              className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors mr-2"
              title="Clear chat history"
            >
              <Trash2 size={20} />
            </button>
          )}
          <div className="w-8">
            {serviceStatus === 'checking' && (
              <div className="h-3 w-3 rounded-full bg-yellow-500 mx-auto animate-pulse" title="Checking service status" />
            )}
            {serviceStatus === 'online' && (
              <div className="h-3 w-3 rounded-full bg-green-500 mx-auto" title="Service online" />
            )}
            {serviceStatus === 'offline' && (
              <div className="h-3 w-3 rounded-full bg-red-500 mx-auto" title="Service offline" />
            )}
          </div>
        </div>
      </div>

      {/* Contenido del chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showWelcomeScreen ? (
          // Pantalla de bienvenida
          <div className="h-full flex flex-col items-center justify-center p-6">
            <img 
              src="/logo/logo@vector.svg" 
              alt="NeuralWallet" 
              className="w-24 h-24 mb-6" 
            />
            <h3 className="text-xl font-bold mb-4 text-center">Hi! I'm your financial assistant</h3>
            <p className="text-gray-500 mb-8 text-center">
              I can help you manage your finances, make transactions, and answer your questions about cryptocurrencies.
            </p>
            <Button 
              className="w-full max-w-xs" 
              onClick={handleContinue}
              disabled={isLoading}
            >
              {isLoading ? "Configuring..." : "Start Chatting"}
            </Button>
          </div>
        ) : serviceStatus === 'offline' ? (
          // Mensaje de servicio fuera de línea
          <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
              <p className="text-center">
                Sorry, the service is not available at the moment. Please try again later.
              </p>
            </div>
          </div>
        ) : !chatStarted ? (
          // Sugerencias iniciales
          <div className="flex-1 p-6 overflow-auto">
            <h3 className="text-lg font-semibold mb-6">How can I help you today?</h3>
            <ChatSuggestion 
              title="View balance" 
              description="Check your account balance"
              onClick={() => handleSuggestionClick("Show me my account balance")}
            />
            <ChatSuggestion 
              title="Send money" 
              description="Transfer funds to another account"
              onClick={() => handleSuggestionClick("I want to send money to a friend")}
            />
            <ChatSuggestion 
              title="Information" 
              description="Learn about cryptocurrencies"
              onClick={() => handleSuggestionClick("What is Stellar?")}
            />
          </div>
        ) : (
          // Mensajes de chat - Reemplazamos ScrollArea por un div con overflow-auto para evitar doble scroll
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col">
              {messages.map((message) => (
                <div key={message.id}>
                  {message.sender === 'user' ? (
                    <UserMessage content={message.content} />
                  ) : (
                    <BotMessage content={message.content} />
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 p-4">
                  <Avatar className="h-10 w-10">
                    <img 
                      src="/logo/logo@vector.svg" 
                      alt="NeuralWallet Bot" 
                      className="h-10 w-10 rounded-full"
                    />
                  </Avatar>
                  <div className="flex items-center space-x-2 p-4 bg-[#EEEEEE] rounded-2xl rounded-tl-none max-w-[80%]">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-150"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input de chat */}
      {(!showWelcomeScreen && serviceStatus !== 'offline') && (
        <div className="mt-auto border-t border-gray-200">
          <ChatInput 
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
};

export default ChatScreen;


