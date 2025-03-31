import React, { useState, useEffect } from "react";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { CreditScoreResult } from "@/services/stellarKitApi";

interface CreditScoreSectionProps {
  onBack: () => void;
}

// Componente para spinner de carga
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full w-full">
    <div className="relative">
      <div className="w-12 h-12 rounded-full absolute border-4 border-gray-200"></div>
      <div className="w-12 h-12 rounded-full animate-spin absolute border-4 border-blue-500 border-t-transparent"></div>
    </div>
  </div>
);

const CreditScoreSection: React.FC<CreditScoreSectionProps> = ({ onBack }) => {
  const { getCreditScore, stellarAddress } = useWeb3Auth();
  const [creditData, setCreditData] = useState<CreditScoreResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchCreditScore = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await getCreditScore();
        
        if (isMounted) {
          setCreditData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching credit score:", err);
          setError("No se pudo obtener el score crediticio. Por favor intenta más tarde.");
          setIsLoading(false);
        }
      }
    };
    
    fetchCreditScore();
    
    return () => {
      isMounted = false;
    };
  }, [getCreditScore]);

  // Función para determinar el color del score basado en el valor
  const getScoreColor = (score: number) => {
    if (score >= 800) return '#10B981'; // Verde excelente
    if (score >= 650) return '#34D399'; // Verde bueno
    if (score >= 500) return '#FBBF24'; // Amarillo regular
    if (score >= 350) return '#F59E0B'; // Naranja bajo
    return '#EF4444'; // Rojo muy bajo
  };

  // Obtener calificación descriptiva basada en el score
  const getScoreRating = (score: number) => {
    if (score >= 800) return 'Excelente';
    if (score >= 650) return 'Bueno';
    if (score >= 500) return 'Regular';
    if (score >= 350) return 'Bajo';
    return 'Muy bajo';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-gray-200">
        <button onClick={onBack} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
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
        <h2 className="text-lg font-semibold mx-auto">Score Crediticio</h2>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 overflow-y-auto bg-gray-50">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="py-10 text-center">
            <div className="rounded-full bg-red-50 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar la información</h3>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : !creditData?.data?.creditScore ? (
          <div className="py-10 text-center">
            <div className="rounded-full bg-yellow-50 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Información no disponible</h3>
            <p className="text-gray-500">No hay suficiente historial de transacciones para generar un score crediticio.</p>
          </div>
        ) : (
          <div className="animate-fadeIn space-y-6">
            {/* Score Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm animate-slideUp" style={{animationDelay: "0.1s"}}>
              <div className="flex flex-col items-center">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-50 mb-4">
                    <span 
                      className="text-4xl font-bold" 
                      style={{ color: getScoreColor(creditData.data.creditScore.score) }}
                    >
                      {creditData.data.creditScore.score}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {getScoreRating(creditData.data.creditScore.score)}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    De un máximo de 1000 puntos
                  </p>
                </div>
                <div className="w-full p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Análisis</h4>
                  <p className="text-sm text-gray-600">{creditData.data.creditScore.reason}</p>
                </div>
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="bg-white rounded-xl p-6 shadow-sm animate-slideUp" style={{animationDelay: "0.2s"}}>
              <h3 className="font-semibold text-lg mb-4">Recomendaciones para Mejorar</h3>
              <ul className="space-y-3">
                {creditData.data.creditScore.improvementTips.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Analysis Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm animate-slideUp" style={{animationDelay: "0.3s"}}>
              <h3 className="font-semibold text-lg mb-4">Detalles de Actividad</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Total Transacciones</p>
                  <p className="text-lg font-semibold text-gray-800">{creditData.data.analysis.transactionCount}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Volumen Total</p>
                  <p className="text-lg font-semibold text-gray-800">{creditData.data.analysis.totalVolume.toFixed(2)} XLM</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Mayor Transacción</p>
                  <p className="text-lg font-semibold text-gray-800">{creditData.data.analysis.largestTransaction.toFixed(2)} XLM</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Frecuencia</p>
                  <p className="text-lg font-semibold text-gray-800">{creditData.data.analysis.frequency.toFixed(2)}/día</p>
                </div>
              </div>
            </div>
            
            {/* AI Recommendation */}
            {creditData.data.englishRecommendation && (
              <div className="bg-white rounded-xl p-6 shadow-sm animate-slideUp" style={{animationDelay: "0.4s"}}>
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg ml-3">Recomendación Personalizada</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 italic">{creditData.data.englishRecommendation}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditScoreSection; 