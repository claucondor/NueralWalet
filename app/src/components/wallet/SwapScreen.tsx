import React, { useState } from "react";
import { useWeb3Auth } from "@/context/Web3AuthContext";

interface SwapScreenProps {
  onClose: () => void;
}

const SwapScreen: React.FC<SwapScreenProps> = ({ onClose }) => {
  const { stellarBalance } = useWeb3Auth();
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  // Mock exchange rate: 1 XLM = 10 GoPay Token
  const exchangeRate = 10;
  
  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      setToAmount((parseFloat(value) * exchangeRate).toFixed(2));
    } else {
      setToAmount("");
    }
  };
  
  const handleToAmountChange = (value: string) => {
    setToAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      setFromAmount((parseFloat(value) / exchangeRate).toFixed(6));
    } else {
      setFromAmount("");
    }
  };
  
  const handleSwap = () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    // Check if user has enough balance
    if (parseFloat(fromAmount) > stellarBalance) {
      setError("Insufficient balance");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    // Simulate swap process
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      
      // Reset after success message
      setTimeout(() => {
        setSuccess(false);
        setFromAmount("");
        setToAmount("");
      }, 3000);
    }, 1500);
  };
  
  const formatMaxBalance = () => {
    return stellarBalance.toFixed(4);
  };
  
  const handleSetMax = () => {
    // Leave a small amount for transaction fees
    const maxAmount = Math.max(0, stellarBalance - 0.5);
    handleFromAmountChange(maxAmount.toFixed(4));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-gray-200 bg-white">
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
        <h2 className="text-lg font-semibold mx-auto">Swap Tokens</h2>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-5">
        <div className="flex flex-col items-center mb-5">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="17 1 21 5 17 9"></polyline>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
              <polyline points="7 23 3 19 7 15"></polyline>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
          </div>
          <div className="text-center">
            <h3 className="font-medium text-lg">Swap Tokens</h3>
            <p className="text-gray-500 text-sm">1 XLM = 10 GPT</p>
          </div>
        </div>

        {/* From token */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-600">From</label>
            <div className="text-xs text-gray-500">
              Balance: {formatMaxBalance()} XLM
              <button 
                onClick={handleSetMax}
                className="ml-2 text-blue-500"
              >
                Max
              </button>
            </div>
          </div>
          <div className="flex p-3 border border-gray-200 rounded-lg bg-white">
            <div className="flex-1">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent focus:outline-none"
                step="0.0000001"
              />
            </div>
            <div className="flex items-center">
              <div className="flex items-center gap-2 bg-gray-100 py-1 px-3 rounded-lg">
                <img
                  src="/tokens/xlm.svg"
                  alt="XLM"
                  className="w-5 h-5"
                />
                <span className="font-medium">XLM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Swap arrow */}
        <div className="flex justify-center -my-2 relative z-10">
          <div className="p-2 bg-blue-500 rounded-full shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
          </div>
        </div>

        {/* To token */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-600">To (estimated)</label>
            <div className="text-xs text-gray-500">
              Rate: 1 XLM = 10 GPT
            </div>
          </div>
          <div className="flex p-3 border border-gray-200 rounded-lg bg-white">
            <div className="flex-1">
              <input
                type="number"
                value={toAmount}
                onChange={(e) => handleToAmountChange(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
            <div className="flex items-center">
              <div className="flex items-center gap-2 bg-gray-100 py-1 px-3 rounded-lg">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">G</div>
                <span className="font-medium">GPT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Price info */}
        <div className="p-3 bg-gray-50 rounded-lg mt-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Price Impact:</span>
            <span className="text-gray-800">0.05%</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>Slippage Tolerance:</span>
            <span className="text-gray-800">0.5%</span>
          </div>
        </div>

        {error && (
          <div className="p-3 mt-4 bg-red-50 text-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mt-4 bg-green-50 text-green-500 rounded-lg text-sm">
            Swap completed successfully!
          </div>
        )}
      </div>
      
      {/* Fixed Button at bottom */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={handleSwap}
          disabled={isLoading || !fromAmount || parseFloat(fromAmount) <= 0}
          className={`w-full p-4 rounded-xl text-white font-medium ${
            isLoading || !fromAmount || parseFloat(fromAmount) <= 0
              ? "bg-gray-400"
              : "bg-blue-500"
          }`}
        >
          {isLoading ? "Processing..." : "Swap Tokens"}
        </button>
        
        <p className="text-center text-xs text-gray-500 mt-2">
          Swapping currently uses simulated data and is for demonstration purposes only.
        </p>
      </div>
    </div>
  );
};

export default SwapScreen; 