import React, { useState, useEffect } from "react";

interface AddCardScreenProps {
  onClose: () => void;
  onAddCard: () => void;
}

const AddCardScreen: React.FC<AddCardScreenProps> = ({ onClose, onAddCard }) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    // Mostrar elementos con animación secuencial
    setTimeout(() => setCardVisible(true), 100);
    setTimeout(() => setFormVisible(true), 400);
  }, []);

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    
    // Format with spaces every 4 digits
    let formatted = "";
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += " ";
      }
      formatted += digits[i];
    }
    
    return formatted.slice(0, 19); // Limit to 16 digits + 3 spaces
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    
    if (value.length > 2) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4);
    }
    
    setExpiryDate(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 3);
    setCvv(value);
  };

  const handleAddCard = () => {
    // Animación al añadir tarjeta
    setCardVisible(false);
    setFormVisible(false);
    
    setTimeout(() => {
      onAddCard();
    }, 500);
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
        <h2 className="text-lg font-semibold mx-auto">Add Card</h2>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-5">
        {/* Card Preview with animation */}
        <div 
          className={`mb-6 transition-all duration-700 transform ${
            cardVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
          }`}
        >
          <div className="bg-blue-500 rounded-xl p-5 w-full aspect-[1.6/1] flex flex-col justify-between shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-start">
              <div className="w-10 h-8 bg-yellow-300 rounded-md"></div>
            </div>
            <div className="text-white">
              <div className="mb-2">
                <div className="text-xl tracking-wider">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs mb-1 opacity-70">Expiry date</div>
                  <div>{expiryDate || "MM/YY"}</div>
                </div>
                <div className="text-lg font-medium">
                  {cardholderName || "Card Holder"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields with animations */}
        <div 
          className={`space-y-4 transition-all duration-700 transform ${
            formVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="transition-all duration-300 hover:translate-x-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">Card number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="5617 0000 0000 0000"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all duration-300"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 transition-all duration-300 hover:translate-x-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">Expiry date</label>
              <input
                type="text"
                value={expiryDate}
                onChange={handleExpiryDateChange}
                placeholder="MM/YY"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all duration-300"
              />
            </div>
            <div className="flex-1 transition-all duration-300 hover:translate-x-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">CVV</label>
              <input
                type="text"
                value={cvv}
                onChange={handleCvvChange}
                placeholder="•••"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all duration-300"
              />
            </div>
          </div>

          <div className="transition-all duration-300 hover:translate-x-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">Card holder name</label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Your name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all duration-300"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="text-sm font-medium text-gray-600">Setting as default card</label>
            <div 
              className={`w-12 h-6 rounded-full relative transition-all cursor-pointer duration-300 ease-in-out transform hover:scale-105 ${isDefault ? "bg-blue-500" : "bg-gray-300"}`}
              onClick={() => setIsDefault(!isDefault)}
            >
              <div 
                className={`absolute w-5 h-5 rounded-full bg-white top-0.5 shadow-md transition-transform duration-300 ease-in-out ${
                  isDefault ? "transform translate-x-6" : "translate-x-0.5"
                }`}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fixed Button at bottom */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={handleAddCard}
          className="w-full p-4 rounded-xl text-white font-medium bg-black transform transition-all duration-300 hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
        >
          <span className="relative z-10">Add Card</span>
          <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 hover:opacity-20 transition-opacity duration-300"></span>
        </button>
      </div>
    </div>
  );
};

export default AddCardScreen; 