import React, { useState, useEffect } from "react";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { sendTransaction, sendTransactionByEmail } from "@/utils/aptos";

interface SendScreenProps {
  onClose: () => void;
  initialAddress?: string | null;
}

const SendScreen: React.FC<SendScreenProps> = ({ onClose, initialAddress = null }) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  
  const { aptosAccount, getBalance, aptosBalance } = useWeb3Auth();

  useEffect(() => {
    if (initialAddress) {
      setRecipient(initialAddress);
    }
  }, [initialAddress]);

  // Check if the input is an email address
  const isEmail = (input: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  };

  // Check if recipient email exists when the input changes
  useEffect(() => {
    const checkEmailExists = async () => {
      if (!recipient || !isEmail(recipient)) {
        setEmailExists(null);
        return;
      }

      setIsEmailMode(true);
      setEmailCheckLoading(true);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_MOVE_AGENT_SERVICE_URL || 'http://localhost:3001'}/api/user/check-email/${encodeURIComponent(recipient)}`
        );
        
        const data = await response.json();
        setEmailExists(data.success && data.data.exists);
      } catch (error) {
        console.error("Error checking email:", error);
        setEmailExists(false);
      } finally {
        setEmailCheckLoading(false);
      }
    };

    // Debounce the email check to avoid making too many requests
    const handler = setTimeout(() => {
      checkEmailExists();
    }, 500);

    return () => clearTimeout(handler);
  }, [recipient]);

  const handleSend = async () => {
    if (!recipient || !amount || !aptosAccount) {
      setError("Please enter a valid address or email and amount");
      return;
    }

    // Check if amount is more than balance
    const balanceInApt = aptosBalance / 100000000;
    if (parseFloat(amount) > balanceInApt) {
      setError("Insufficient balance");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      // Convert amount to octas (APT * 10^8)
      const amountInOctas = Math.floor(parseFloat(amount) * 100000000).toString();
      
      let txHash;
      
      // If it's an email, use sendTransactionByEmail, otherwise use sendTransaction
      if (isEmail(recipient)) {
        if (!emailExists) {
          setError("The email is not registered in the system");
          setIsLoading(false);
          return;
        }
        
        txHash = await sendTransactionByEmail(aptosAccount, recipient, amountInOctas);
      } else {
        txHash = await sendTransaction(aptosAccount, recipient, amountInOctas);
      }
      
      console.log("Transaction hash:", txHash);
      
      setSuccess(true);
      getBalance(); // Update balance after transaction
      
    } catch (error) {
      console.error("Error sending transaction:", error);
      setError(error instanceof Error ? error.message : "Error sending transaction");
    } finally {
      setIsLoading(false);
    }
  };

  const formatMaxBalance = () => {
    const balanceInApt = aptosBalance / 100000000;
    return balanceInApt.toFixed(4);
  };

  const handleSetMax = () => {
    const balanceInApt = aptosBalance / 100000000;
    setAmount(balanceInApt.toString());
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
        <h2 className="text-lg font-semibold mx-auto">Send Funds</h2>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-5">
        <div className="flex flex-col space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-600">
                {isEmailMode ? "Recipient Email" : "Recipient Address or Email"}
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className={`w-full p-3 border ${
                    emailExists === false && isEmailMode 
                      ? "border-red-300 focus:ring-red-500" 
                      : emailExists === true 
                        ? "border-green-300 focus:ring-green-500" 
                        : "border-gray-300 focus:ring-blue-500"
                  } rounded-xl focus:outline-none focus:ring-2`}
                  placeholder={isEmailMode ? "johndoe@example.com" : "Email or 0x address"}
                />
                
                {emailCheckLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                
                {emailExists === true && !emailCheckLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {emailExists === false && !emailCheckLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              {isEmailMode && emailExists === false && (
                <p className="text-xs text-red-500 mt-1">
                  This email is not registered in the system. The user must register first.
                </p>
              )}
              
              {isEmailMode && emailExists === true && (
                <p className="text-xs text-green-500 mt-1">
                  User found. APT will be sent to their associated address.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-600">Amount</label>
                <button
                  onClick={handleSetMax}
                  className="text-sm text-blue-500 font-medium"
                >
                  Max: {formatMaxBalance()}
                </button>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.0"
                step="0.1"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-500 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm">
              Transaction sent successfully! It may take a moment to confirm on the blockchain.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={handleSend}
          disabled={isLoading || success || (emailExists === false && isEmailMode)}
          className={`w-full p-4 rounded-xl text-white font-medium ${
            isLoading || success || (emailExists === false && isEmailMode)
              ? "bg-gray-400"
              : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
          } transition-colors`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : success ? (
            "Transaction Complete"
          ) : (
            "Send"
          )}
        </button>
      </div>
    </div>
  );
};

export default SendScreen;