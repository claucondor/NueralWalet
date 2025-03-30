import * as React from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { useNavigate } from "react-router-dom";
import styled from 'styled-components';

// Create a styled button directly without nesting styled components
const StyledButton = styled.button`
  width: 100%;
  color: #ffffff;
  padding: 0.7em 1.7em;
  font-size: 18px;
  border-radius: 1rem;
  background-image: linear-gradient(to right, #464646, #000000);
  cursor: pointer;
  border: 1px solid #dadada;
  transition: all 0.7s;
  box-shadow:
    6px 6px 12px #c5c5c5,
    -6px -6px 12px #ffffff;

  &:active {
    color: #000000;
    box-shadow:
      inset 21px 21px 21px #c5c5c5,
      inset -21px -21px 21px #ffffff;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background-color: #ffeeee;
  border: 1px solid #ffcccc;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-top: 1rem;
  text-align: left;
  color: #cc0000;
  font-size: 0.9rem;
  font-weight: normal;
`;

interface AuthButtonsProps {
  className?: string;
}

export function AuthButtons({ className }: AuthButtonsProps) {
  const { login, isLoading, initError, isInitialized } = useWeb3Auth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Detectar errores de inicialización
  useEffect(() => {
    if (initError) {
      if (initError.includes('INSUFFICIENT_RESOURCES') || initError.includes('Failed to fetch')) {
        setError('Web3Auth service is currently experiencing high demand. Please try again later or contact support.');
      } else {
        setError(`Authentication service error: ${initError.substring(0, 100)}${initError.length > 100 ? '...' : ''}`);
      }
    } else {
      setError(null);
    }
  }, [initError]);

  const handleLogin = async () => {
    try {
      setError(null);
      await login();
      navigate("/wallet");
    } catch (error: any) {
      console.error("Login failed:", error);
      setError(error?.message || "Login failed. Please try again.");
    }
  };

  // Mostrar mensaje especial mientras se inicializa
  if (!isInitialized && !initError) {
    return (
      <div className={cn("w-full text-base font-bold text-center", className)}>
        <div className="animate-pulse text-gray-600 mb-4">
          Initializing authentication service...
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full text-base font-bold text-center", className)}>
      <StyledButton 
        onClick={handleLogin} 
        disabled={isLoading || Boolean(initError)}
      >
        {isLoading ? "Connecting..." : "Sign Up or Login"}
      </StyledButton>
      
      {error && (
        <ErrorMessage>
          <strong>Error: </strong>
          {error}
          <div className="mt-2 text-sm">
            Try again later or use a direct wallet account. If the issue persists, please contact support.
          </div>
        </ErrorMessage>
      )}
      
      <p className="mt-2 text-sm font-normal text-gray-500">
        Powered by Web3Auth
      </p>
    </div>
  );
}
