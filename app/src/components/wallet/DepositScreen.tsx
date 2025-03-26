import React, { useState, useEffect } from "react";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { requestAirdrop, simulatePurchaseAPT } from "@/utils/aptos";
import AddCardScreen from "./AddCardScreen";

interface DepositScreenProps {
  onClose: () => void;
}

// Preset amount options (only integers since the faucet can only handle whole APT)
const AMOUNT_OPTIONS = [
  { value: "1", label: "1 APT" },
  { value: "2", label: "2 APT" },
  { value: "3", label: "3 APT" },
  { value: "5", label: "5 APT" }
];

const DepositScreen: React.FC<DepositScreenProps> = ({ onClose }) => {
  const { aptosAddress, getBalance } = useWeb3Auth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>("credit");
  const [showAddCard, setShowAddCard] = useState(false);
  const [methodsVisible, setMethodsVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const [amount, setAmount] = useState("1"); // Default 1 APT
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [redirecting, setRedirecting] = useState(false);

  // APT price in USD (hardcoded for demo)
  const APT_PRICE_USD = 6.34;

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
    if (!aptosAddress) {
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
      if (selectedMethod === "aptos") {
        // Usar el faucet directamente para Aptos Pay
        const result = await requestAirdrop(aptosAddress, amount);
        
        if (result) {
          setSuccess(true);
          // Set a timer to check the balance after airdrop
          setTimeout(() => {
            getBalance();
          }, 1500);
        } else {
          setError("Failed to request devnet tokens. Please try again later.");
        }
      } else {
        // Simular compra con tarjeta de crédito u otros métodos
        const result = await simulatePurchaseAPT(aptosAddress, amount, selectedMethod || "credit");
        
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
      id: "aptos",
      name: "Aptos Pay",
      icon: "A",
      iconBg: "#E8415B",
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
          {/* Information banner about devnet */}
          {selectedMethod === "aptos" && (
            <div className={`mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm transition-all duration-500 ${
              methodsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            }`}>
              <div className="font-medium mb-1">Aptos Devnet Mode</div>
              <p>This wallet is connected to Aptos Devnet, where you can get free test tokens using the faucet.</p>
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
                  {selectedMethod !== "aptos" && (
                    <span className="block text-xs mt-1 opacity-80">
                      ${(parseFloat(option.value) * APT_PRICE_USD).toFixed(2)} USD
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            {/* Custom amount input */}
            <div className="flex items-center bg-white p-3 rounded-xl border border-gray-200">
              <input
                type="number"
                className="flex-1 text-lg font-medium outline-none"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={selectedMethod === "aptos" ? "1" : "0.1"}
                step={selectedMethod === "aptos" ? "1" : "0.1"}
                placeholder={selectedMethod === "aptos" ? "Enter whole amount" : "Enter amount"}
              />
              <span className="text-gray-500 font-medium mr-2">APT</span>
              {selectedMethod !== "aptos" && (
                <span className="text-sm text-gray-500">
                  ≈ ${(parseFloat(amount || "0") * APT_PRICE_USD).toFixed(2)}
                </span>
              )}
            </div>
            {selectedMethod === "aptos" && (
              <p className="text-xs text-gray-500 mt-1 ml-1">
                Note: Only whole numbers (1, 2, 3, etc.) are supported with Aptos Pay.
              </p>
            )}
          </div>

          <h3 className={`text-sm font-medium text-gray-600 mb-3 transition-all duration-500 ${
            methodsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
          }`}>Payment Method</h3>
          
          <div className={`space-y-3 transition-all duration-500 transform ${
            methodsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            {paymentMethods.map((method, index) => (
              <div 
                key={method.id}
                className={`flex items-center p-3 rounded-xl border cursor-pointer ${selectedMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} 
                transition-all duration-300 hover:shadow-md transform hover:translate-x-1 ${methodsVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={() => setSelectedMethod(method.id)}
                style={{
                  transitionDelay: `${index * 50}ms`,
                  transform: `scale(${selectedMethod === method.id ? '1.02' : '1'}) translateX(${methodsVisible ? '0' : '-10px'})`,
                }}
              >
                <div className="mr-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm transition-transform duration-300 transform hover:scale-110"
                    style={{ background: method.iconBg }}
                  >
                    {method.icon}
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {method.name}
                    {method.last4 && <span className="text-gray-500 ml-2">**** {method.last4}</span>}
                  </div>
                  <div 
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      selectedMethod === method.id ? 'border-blue-500 scale-110' : 'border-gray-300'
                    }`}
                  >
                    {selectedMethod === method.id && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <div className={`flex items-center justify-center py-3 mt-2 transition-all duration-500 transform ${
              methodsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`} style={{ transitionDelay: '400ms' }}>
              <button 
                className="flex items-center text-blue-500 font-medium hover:text-blue-700 transition-all duration-300 transform hover:scale-105"
                onClick={handleAddNewCard}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add new card
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 mb-4 mt-4 bg-red-50 text-red-500 rounded-lg text-sm animate-pulse">
              {error}
            </div>
          )}

          {success && !error && (
            <div className="p-3 mb-4 mt-4 bg-green-50 text-green-700 rounded-lg text-sm">
              {selectedMethod === "aptos" ? (
                <div className="animate-bounce">
                  Faucet request successful! {amount} APT should arrive in your wallet shortly.
                  {redirecting ? (
                    <p className="mt-2 text-blue-500">Returning to wallet...</p>
                  ) : (
                    <p className="mt-2 text-xs text-green-600">Redirecting to wallet in a moment...</p>
                  )}
                </div>
              ) : transactionDetails ? (
                <div>
                  <div className="font-medium mb-1">Purchase Successful!</div>
                  <p>Successfully purchased {transactionDetails.amount} APT for ${transactionDetails.cost} USD.</p>
                  <p className="text-xs mt-1 text-green-600">Transaction ID: #{Math.floor(Math.random() * 10000000)}</p>
                  {redirecting ? (
                    <p className="mt-2 text-blue-500">Returning to wallet...</p>
                  ) : (
                    <p className="mt-2 text-xs text-green-600">Redirecting to wallet in a moment...</p>
                  )}
                </div>
              ) : (
                <div className="animate-bounce">
                  Purchase successful! {amount} APT should arrive in your wallet shortly.
                  {redirecting ? (
                    <p className="mt-2 text-blue-500">Returning to wallet...</p>
                  ) : (
                    <p className="mt-2 text-xs text-green-600">Redirecting to wallet in a moment...</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Fixed Button at bottom */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={handlePurchase}
          disabled={isLoading || !selectedMethod || success}
          className={`w-full p-4 rounded-xl text-white font-medium transition-all duration-500 transform ${
            buttonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          } ${
            isLoading || !selectedMethod || success
              ? "bg-gray-400"
              : "bg-blue-500 hover:bg-blue-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          }`}
        >
          <span className="relative z-10">
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : success ? "Transaction Complete" : selectedMethod === "aptos" ? "Get Free Devnet Tokens" : `Buy ${amount} APT for $${(parseFloat(amount || "0") * APT_PRICE_USD).toFixed(2)}`}
          </span>
        </button>
      </div>
    </div>
  );
};

export default DepositScreen; 