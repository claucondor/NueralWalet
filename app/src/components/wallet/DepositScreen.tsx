import React, { useState, useEffect } from "react";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { requestTestnetXLM, simulatePurchaseXLM } from "@/utils/stellar";
import AddCardScreen from "./AddCardScreen";

interface DepositScreenProps {
  onClose: () => void;
}

// Preset amount options
const AMOUNT_OPTIONS = [
  { value: "10", label: "10 XLM" },
  { value: "20", label: "20 XLM" },
  { value: "50", label: "50 XLM" },
  { value: "100", label: "100 XLM" }
];

const DepositScreen: React.FC<DepositScreenProps> = ({ onClose }) => {
  const { stellarAddress, getBalance } = useWeb3Auth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>("credit");
  const [showAddCard, setShowAddCard] = useState(false);
  const [methodsVisible, setMethodsVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const [amount, setAmount] = useState("10"); // Default 10 XLM
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [redirecting, setRedirecting] = useState(false);

  // XLM price in USD (hardcoded for demo)
  const XLM_PRICE_USD = 0.11;

  useEffect(() => {
    // Mostrar elementos con animación secuencial al montar
    setTimeout(() => setMethodsVisible(true), 100);
    setTimeout(() => setButtonVisible(true), 500);
  }, []);

  // Effect to handle redirect after successful transaction
  useEffect(() => {
    if (success && !error && !redirecting) {
      // Set a timer to redirect back to wallet view
      const timer = setTimeout(() => {
        setRedirecting(true);
        // Animate out before redirecting
        setMethodsVisible(false);
        setButtonVisible(false);
        
        setTimeout(() => {
          onClose(); // Return to wallet view
        }, 800);
      }, 3000); // Wait 3 seconds before redirecting
      
      return () => clearTimeout(timer);
    }
  }, [success, error, redirecting, onClose]);

  const handlePurchase = async () => {
    if (!stellarAddress) {
      setError("Wallet address not available.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess(false);
      setTransactionDetails(null);
      setRedirecting(false);
      
      // Validar monto
      const requestedAmount = parseFloat(amount);
      if (isNaN(requestedAmount) || requestedAmount <= 0) {
        setError("Please enter a valid amount greater than 0.");
        setIsLoading(false);
        return;
      }
      
      // Diferentes comportamientos según el método de pago seleccionado
      if (selectedMethod === "stellar") {
        // Usar el faucet directamente para Stellar Testnet
        const result = await requestTestnetXLM(stellarAddress);
        
        if (result) {
          setSuccess(true);
          // Set a timer to check the balance after airdrop
          setTimeout(() => {
            getBalance();
          }, 1500);
        } else {
          setError("Failed to request testnet tokens. Please try again later.");
        }
      } else {
        // Simular compra con tarjeta de crédito u otros métodos
        const result = await simulatePurchaseXLM(stellarAddress, amount, selectedMethod || "credit");
        
        if (result.success) {
          setSuccess(true);
          setTransactionDetails(result);
          // Set a timer to check the balance after purchase
          setTimeout(() => {
            getBalance();
          }, 1500);
        } else {
          setError("Failed to process payment. Please try again later.");
        }
      }
    } catch (error) {
      console.error("Error processing transaction:", error);
      setError("An error occurred while processing your transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: "stellar",
      name: "Stellar Testnet",
      icon: "✨",
      iconBg: "#3E7BE8",
      last4: "",
    },
    {
      id: "credit",
      name: "Credit Card",
      icon: "💳",
      iconBg: "transparent",
      last4: "",
    },
    {
      id: "visa1",
      name: "Visa",
      icon: "💳",
      iconBg: "#1434CB",
      last4: "7058",
    },
    {
      id: "visa2",
      name: "Visa",
      icon: "💳",
      iconBg: "#1434CB",
      last4: "2322",
    },
    {
      id: "google",
      name: "Google Pay",
      icon: "G",
      iconBg: "#4285F4",
      last4: "",
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: "P",
      iconBg: "#003087",
      last4: "",
    },
    {
      id: "wise",
      name: "Wise",
      icon: "W",
      iconBg: "#48D494",
      last4: "",
    },
  ];

  const handleAddNewCard = () => {
    setMethodsVisible(false);
    setButtonVisible(false);
    
    setTimeout(() => {
      setShowAddCard(true);
    }, 300);
  };

  const handleCardAdded = () => {
    // In a real app, you would save the card details
    setShowAddCard(false);
    
    // Animar al volver
    setTimeout(() => {
      // Simulate a new card being added
      setSelectedMethod("newCard");
      setMethodsVisible(true);
      setButtonVisible(true);
    }, 100);
  };

  if (showAddCard) {
    return <AddCardScreen onClose={() => setShowAddCard(false)} onAddCard={handleCardAdded} />;
  }

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
        <h2 className="text-lg font-semibold mx-auto">Deposit Funds</h2>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-5">
        <div className="flex flex-col">
          {/* Information banner about testnet */}
          {selectedMethod === "stellar" && (
            <div className={`mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm transition-all duration-500 ${
              methodsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            }`}>
              <div className="font-medium mb-1">Stellar Testnet Mode</div>
              <p>This wallet is connected to Stellar Testnet, where you can get free test tokens using the friendbot faucet.</p>
            </div>
          )}
          
          {/* Amount selection */}
          <div className={`mb-4 transition-all duration-500 ${
            methodsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
          }`}>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Amount to Purchase</h3>
            
            {/* Preset amount buttons */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {AMOUNT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    amount === option.value
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setAmount(option.value)}
                >
                  {option.label}
                  {selectedMethod !== "stellar" && (
                    <span className="text-xs block mt-1 opacity-75">
                      ≈ ${(parseFloat(option.value) * XLM_PRICE_USD).toFixed(2)}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            {/* Custom amount input */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label htmlFor="custom-amount" className="text-xs text-gray-500 mb-1 block">
                    Custom Amount
                  </label>
                  <input
                    id="custom-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border-0 p-0 text-xl font-medium focus:ring-0 focus:outline-none"
                    min={selectedMethod === "stellar" ? "1" : "0.1"}
                    step={selectedMethod === "stellar" ? "1" : "0.1"}
                    placeholder={selectedMethod === "stellar" ? "Enter whole amount" : "Enter amount"}
                  />
                </div>
                {selectedMethod !== "stellar" && (
                  <div className="text-gray-500 text-sm">
                    ≈ ${(parseFloat(amount || "0") * XLM_PRICE_USD).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Payment methods */}
          <div className={`mb-4 transition-all duration-500 ${
            methodsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
          }`}>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Payment Method</h3>
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
              {paymentMethods.map((method, index) => (
                <div 
                  key={method.id}
                  className={`flex items-center p-4 ${
                    index !== paymentMethods.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <button
                    className="flex-1 flex items-center"
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white"
                      style={{ background: method.iconBg }}
                    >
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{method.name}</p>
                      {method.last4 && (
                        <p className="text-xs text-gray-500">•••• {method.last4}</p>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={selectedMethod === method.id}
                      onChange={() => setSelectedMethod(method.id)}
                      className="h-4 w-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
              
              {/* Add new payment method button */}
              <div className="p-4 border-t border-gray-100">
                <button 
                  onClick={handleAddNewCard}
                  className="text-blue-500 text-sm font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Payment Method
                </button>
              </div>
            </div>
          </div>
          
          {/* Status messages */}
          {error && (
            <div className={`mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm ${
              methodsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } transition-all duration-500`}>
              {error}
            </div>
          )}
          
          {success && (
            <div className={`mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm ${
              methodsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } transition-all duration-500`}>
              <div className="font-medium mb-1">Transaction Successful!</div>
              <p>Your XLM tokens have been added to your wallet.</p>
              {transactionDetails && (
                <div className="mt-2 text-green-700">
                  <p>Amount: {transactionDetails.amount} XLM</p>
                  <p>Total Cost: ${transactionDetails.cost}</p>
                  <p>Date: {new Date(transactionDetails.timestamp).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer with action button */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={handlePurchase}
          disabled={isLoading}
          className={`w-full py-3 rounded-xl font-medium transition-all duration-500 transform ${
            buttonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          } ${
            isLoading 
              ? 'bg-blue-300 text-white' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : (
            selectedMethod === "stellar" ? "Get Free Testnet XLM" : `Buy ${amount} XLM`
          )}
        </button>
        
        {selectedMethod !== "stellar" && (
          <p className="text-center text-xs text-gray-500 mt-2">
            Total Cost: ${(parseFloat(amount || "0") * XLM_PRICE_USD).toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
};

export default DepositScreen; 