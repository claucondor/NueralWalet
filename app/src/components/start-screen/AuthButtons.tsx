import * as React from "react";
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

interface AuthButtonsProps {
  className?: string;
}

export function AuthButtons({ className }: AuthButtonsProps) {
  const { login, isLoading } = useWeb3Auth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await login();
      navigate("/wallet");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className={cn("w-full text-base font-bold text-center", className)}>
      <StyledButton onClick={handleLogin} disabled={isLoading}>
        {isLoading ? "Connecting..." : "Sign Up or Login"}
      </StyledButton>
      <p className="mt-2 text-sm font-normal text-gray-500">
        Powered by Web3Auth
      </p>
    </div>
  );
}
