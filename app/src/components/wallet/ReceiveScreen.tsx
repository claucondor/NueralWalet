import React, { useEffect, useState } from "react";
import { useWeb3Auth } from "@/context/Web3AuthContext";

interface ReceiveScreenProps {
  onClose: () => void;
}

const ReceiveScreen: React.FC<ReceiveScreenProps> = ({ onClose }) => {
  const { aptosAddress } = useWeb3Auth();
  const [isCopied, setIsCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    if (aptosAddress) {
      // Crear una URL que dirija a la página de envío en la aplicación
      // Usamos window.location para obtener el dominio actual (funciona en localhost y producción)
      const baseUrl = window.location.origin;
      // Creamos un objeto URL con parámetros para la dirección
      const sendUrl = new URL("/send", baseUrl);
      sendUrl.searchParams.append("address", aptosAddress);
      
      // Generar QR code usando una API gratuita
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sendUrl.toString())}`;
      setQrCodeUrl(qrUrl);
    }
  }, [aptosAddress]);

  const handleCopy = () => {
    if (aptosAddress) {
      navigator.clipboard.writeText(aptosAddress);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    const start = address.substring(0, 8);
    const end = address.substring(address.length - 8);
    return `${start}...${end}`;
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
        <h2 className="text-lg font-semibold mx-auto">Receive Tokens</h2>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-5">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6">
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
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
          </div>

          {qrCodeUrl ? (
            <div className="mb-6 w-56 h-56">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-full h-full"
              />
              <p className="text-xs text-center text-gray-500 mt-2">
                Scan to send tokens to this address
              </p>
            </div>
          ) : (
            <div className="w-56 h-56 flex items-center justify-center bg-gray-200 mb-6">
              Generating QR code...
            </div>
          )}

          <div className="w-full text-center mb-4">
            <p className="text-sm text-gray-500 mb-1">Your wallet address</p>
            <p className="text-black font-medium">
              {formatAddress(aptosAddress)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Fixed Button at bottom */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 p-3 bg-gray-100 rounded-xl text-black font-medium w-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          {isCopied ? "Copied!" : "Copy address"}
        </button>
        
        <p className="text-center text-xs text-gray-500 mt-4">
          Share your QR code or address to receive APT tokens
        </p>
      </div>
    </div>
  );
};

export default ReceiveScreen;