import React, { useState, useEffect } from "react";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { sendTransaction, sendTransactionByEmail } from "@/utils/stellar";
import { useCustomTokens, CustomToken } from "@/hooks/useCustomTokens";
import { tokenService } from "@/services/stellarKitApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SendScreenProps {
  onClose: () => void;
  initialAddress?: string | null;
}

const SendScreen: React.FC<SendScreenProps> = ({ onClose, initialAddress = null }) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [selectedToken, setSelectedToken] = useState<"XLM" | CustomToken>("XLM");
  const [selectedTokenBalance, setSelectedTokenBalance] = useState<number | string>(0);
  
  const { stellarAccount, getBalance, stellarBalance, stellarAddress } = useWeb3Auth();
  const { customTokens } = useCustomTokens();

  useEffect(() => {
    if (initialAddress) {
      setRecipient(initialAddress);
    }
  }, [initialAddress]);

  // Actualizar el balance del token seleccionado cuando cambia la selección
  useEffect(() => {
    const updateSelectedTokenBalance = async () => {
      if (selectedToken === "XLM") {
        setSelectedTokenBalance(stellarBalance);
      } else if (selectedToken && typeof selectedToken !== "string" && stellarAccount) {
        try {
          const balance = await tokenService.getTokenBalance(selectedToken.contractId, stellarAccount.publicKey);
          if (balance && balance.formattedBalance) {
            setSelectedTokenBalance(balance.formattedBalance);
          } else if (balance && balance.balance) {
            setSelectedTokenBalance(balance.balance);
          } else {
            setSelectedTokenBalance("0");
          }
        } catch (error) {
          console.error(`Error al obtener balance del token ${selectedToken.contractId}:`, error);
          setSelectedTokenBalance("0");
        }
      }
    };

    updateSelectedTokenBalance();
  }, [selectedToken, stellarBalance, stellarAccount]);

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
    if (!recipient || !amount || !stellarAccount) {
      setError("Por favor ingresa una dirección o email válido y un monto");
      return;
    }

    // Verificar si el monto es mayor que el balance disponible
    const amountNum = parseFloat(amount);
    const balanceNum = typeof selectedTokenBalance === 'string' ? 
      parseFloat(selectedTokenBalance) : selectedTokenBalance;
    
    if (amountNum > balanceNum) {
      setError("Balance insuficiente");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      let result;
      
      // Si es XLM
      if (selectedToken === "XLM") {
        // Si es un email, usar sendTransactionByEmail, de lo contrario usar sendTransaction
        if (isEmail(recipient)) {
          if (!emailExists) {
            setError("El email no está registrado en el sistema");
            setIsLoading(false);
            return;
          }
          
          result = await sendTransactionByEmail(
            stellarAccount.secretKey,
            recipient,
            amount,
            { memo }
          );
        } else {
          result = await sendTransaction(
            stellarAccount.secretKey,
            recipient,
            amount,
            { memo }
          );
        }
      } 
      // Si es un token personalizado
      else if (typeof selectedToken !== "string") {
        // Para tokens personalizados, solo se pueden enviar a direcciones Stellar, no a emails
        if (isEmail(recipient)) {
          setError("Los tokens personalizados solo pueden enviarse a direcciones Stellar, no a emails");
          setIsLoading(false);
          return;
        }
        
        // Usar el servicio de tokens para enviar tokens personalizados
        result = await tokenService.sendToken(
          selectedToken.contractId,
          stellarAccount.secretKey,
          recipient,
          amount
        );
      }
      
      if (!result || !result.success) {
        throw new Error(result?.error || "La transacción falló");
      }
      
      console.log("Hash de transacción:", result.hash);
      
      setSuccess(true);
      
      // Actualizar el balance después de la transacción
      if (selectedToken === "XLM") {
        getBalance();
      } else {
        // Actualizar el balance del token seleccionado
        const tokenBalance = await tokenService.getTokenBalance(
          (selectedToken as CustomToken).contractId, 
          stellarAccount.publicKey
        );
        if (tokenBalance && tokenBalance.formattedBalance) {
          setSelectedTokenBalance(tokenBalance.formattedBalance);
        } else if (tokenBalance && tokenBalance.balance) {
          setSelectedTokenBalance(tokenBalance.balance);
        }
      }
      
    } catch (error) {
      console.error("Error al enviar la transacción:", error);
      setError(error instanceof Error ? error.message : "Error al enviar la transacción");
    } finally {
      setIsLoading(false);
    }
  };

  const formatMaxBalance = () => {
    if (selectedToken === "XLM") {
      return stellarBalance.toFixed(4);
    } else if (typeof selectedToken !== "string") {
      // Para tokens personalizados, mostrar el balance con los decimales correctos
      const balance = typeof selectedTokenBalance === 'string' ? 
        parseFloat(selectedTokenBalance) : selectedTokenBalance;
      return balance.toFixed(selectedToken.decimals);
    }
    return "0";
  };

  const handleSetMax = () => {
    if (selectedToken === "XLM") {
      // Dejar una pequeña cantidad para las tarifas de transacción
      const maxSendable = Math.max(0, stellarBalance - 0.5);
      setAmount(maxSendable.toFixed(7));
    } else if (typeof selectedToken !== "string") {
      // Para tokens personalizados, usar todo el balance disponible
      const balance = typeof selectedTokenBalance === 'string' ? 
        parseFloat(selectedTokenBalance) : selectedTokenBalance;
      setAmount(balance.toString());
    }
  };
  
  // Obtener el símbolo del token seleccionado
  const getSelectedTokenSymbol = () => {
    if (selectedToken === "XLM") {
      return "XLM";
    } else if (typeof selectedToken !== "string") {
      return selectedToken.symbol;
    }
    return "";
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
                  placeholder={isEmailMode ? "johndoe@example.com" : "Email or G... address"}
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
                  User found. XLM will be sent to their associated address.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex flex-col space-y-4">
              {/* Selector de token */}
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-600">Token a enviar</label>
                <Select 
                  value={selectedToken === "XLM" ? "XLM" : selectedToken.contractId}
                  onValueChange={(value) => {
                    if (value === "XLM") {
                      setSelectedToken("XLM");
                    } else {
                      const token = customTokens.find(t => t.contractId === value);
                      if (token) {
                        setSelectedToken(token);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un token" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XLM">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src="https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png" alt="XLM" />
                          <AvatarFallback>XLM</AvatarFallback>
                        </Avatar>
                        <span>XLM (Stellar Lumens)</span>
                      </div>
                    </SelectItem>
                    {customTokens.map((token) => (
                      <SelectItem key={token.contractId} value={token.contractId}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {token.logoUrl ? (
                              <AvatarImage src={token.logoUrl} alt={token.symbol} />
                            ) : null}
                            <AvatarFallback>{token.symbol.slice(0, 3)}</AvatarFallback>
                          </Avatar>
                          <span>{token.symbol} ({token.name})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Campo de monto */}
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-gray-600">Monto</label>
                  <button
                    onClick={handleSetMax}
                    className="text-sm text-blue-500 font-medium"
                  >
                    Max: {formatMaxBalance()} {getSelectedTokenSymbol()}
                  </button>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                  step={selectedToken === "XLM" ? "0.0000001" : "0.000001"}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-600">Memo (Optional)</label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a memo to your transaction"
                maxLength={28}
              />
              <p className="text-xs text-gray-500">
                {memo.length}/28 characters
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-500 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm">
              Transaction sent successfully! It may take a moment to confirm on the Stellar network.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={handleSend}
          disabled={isLoading || !recipient || !amount || (isEmailMode && emailExists === false)}
          className={`w-full py-3 px-4 flex justify-center items-center text-white font-semibold rounded-xl 
            ${
              isLoading || !recipient || !amount || (isEmailMode && emailExists === false)
                ? "bg-blue-300"
                : "bg-blue-500 hover:bg-blue-600"
            } transition-colors`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando...
            </>
          ) : (
            `Enviar ${getSelectedTokenSymbol()}`
          )}
        </button>
      </div>
    </div>
  );
};

export default SendScreen;