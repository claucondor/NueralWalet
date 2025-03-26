import React, { useState } from "react";
import { Send } from "lucide-react";
import styled from 'styled-components';
import ButtonIcon from "@/components/ui/button_styled_icon";

// Create a styled input based on the input_styled.tsx component
const StyledInputWrapper = styled.div`
  .input {
   border: none;
   padding: 0.75rem; /* Reduced padding */
   border-radius: 1rem;
   background: #e8e8e8;
   box-shadow: 15px 15px 45px #c5c5c5, /* Reduced shadow size */
  		-15px -15px 45px #ffffff;
   transition: 0.3s;
   width: 100%;
   font-size: 0.9rem; /* Smaller font size */
  }

  .input:focus {
   outline-color: #e8e8e8;
   background: #e8e8e8;
   box-shadow: inset 15px 15px 45px #c5c5c5, /* Reduced shadow size */
  		inset -15px -15px 45px #ffffff;
   transition: 0.3s;
  }
`;

// Custom send icon component
const SendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="22" y1="2" x2="11" y2="13" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface ChatInputProps {
  onSendMessage?: (message: string) => void;
  onInputClick?: () => void;
  isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onInputClick, isLoading = false }) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && onSendMessage) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="sticky-safe-bottom z-20 flex w-full items-center gap-3 px-3 py-4 border-t border-[rgba(244,244,244,1)] bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-safe">
      <StyledInputWrapper className="flex-1 flex items-center gap-2">
        <div className="flex items-center gap-2 w-full">
          <img
            src="/logo/logo@vector.svg"
            className="aspect-[1] object-contain w-8 h-8 shrink-0 animate-floating" /* Smaller logo */
            alt="Bot"
          />
          <input
            type="text"
            className="input bg-transparent"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            onClick={(e) => {
              e.stopPropagation();
              if (onInputClick) onInputClick();
            }}
            disabled={isLoading}
          />
        </div>
      </StyledInputWrapper>
      
      {isLoading ? (
        <div className="h-10 w-10 flex items-center justify-center">
          <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-gray-400 animate-spin" />
        </div>
      ) : (
        <ButtonIcon 
          onClick={handleSend} 
          disabled={!message.trim()}
          icon={<SendIcon />}
        />
      )}
    </div>
  );
};

export default ChatInput;
