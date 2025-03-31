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
        console.log("🔄 Fetching credit score...");
        const result = await getCreditScore('en');
        console.log("📋 Credit score result:", result);
        
        if (isMounted) {
          setCreditData(result);
          setIsLoading(false);
          
          // Log detailed structure for debugging
          if (result?.data) {
            console.log("📊 Analysis data:", result.data.analysis);
            console.log("🏆 Credit score data:", result.data.creditScore);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching credit score:", err);
          setError("Could not get the credit score. Please try again later.");
          setIsLoading(false);
        }
      }
    };
    
    fetchCreditScore();
    
    return () => {
      isMounted = false;
    };
  }, [getCreditScore]);

  // Function to determine score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 800) return '#10B981'; // Excellent - green
    if (score >= 650) return '#34D399'; // Good - green
    if (score >= 500) return '#FBBF24'; // Average - yellow
    if (score >= 350) return '#F59E0B'; // Low - orange
    return '#EF4444'; // Very low - red
  };

  // Get descriptive rating based on score
  const getScoreRating = (score: number) => {
    if (score >= 800) return 'Excellent';
    if (score >= 650) return 'Good';
    if (score >= 500) return 'Average';
    if (score >= 350) return 'Low';
    return 'Very Low';
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
        <h2 className="text-lg font-semibold mx-auto">Credit Score</h2>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading information</h3>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : !creditData?.data?.creditScore?.score ? (
          <div className="py-10 text-center">
            {/* Debug information */}
            <div className="text-xs text-gray-400 mb-4">
              Debug: {JSON.stringify({
                hasData: !!creditData?.data,
                hasAnalysis: !!creditData?.data?.analysis,
                txCount: creditData?.data?.analysis?.transactionCount,
                hasScore: !!creditData?.data?.creditScore?.score,
                score: creditData?.data?.creditScore?.score
              })}
            </div>
            <div className="rounded-full bg-yellow-50 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Credit Score Available</h3>
            <p className="text-gray-500 mb-4">Your credit score could not be calculated. Please try again later.</p>
            {creditData?.data?.analysis && (
              <div className="bg-white rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-gray-700 mb-2">Current transactions: <span className="font-semibold">{creditData.data.analysis.transactionCount}</span></p>
                <p className="text-sm text-gray-700">To improve your score, make more transactions and maintain a consistent history.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fadeIn space-y-6">
            {/* Show warning for insufficient transactions */}
            {creditData.data.analysis && creditData.data.analysis.transactionCount < 5 && (
              <div className="bg-yellow-50 rounded-xl p-4 mb-4 shadow-sm border border-yellow-100">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Limited Transaction History</h3>
                    <div className="mt-1 text-xs text-yellow-700">
                      <p>Your score is based on only {creditData.data.analysis.transactionCount} transactions. For a more accurate score, at least 5 transactions are recommended.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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
                    Out of a maximum of 1000 points
                  </p>
                </div>
                <div className="w-full p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Analysis</h4>
                  <p className="text-sm text-gray-600">{creditData.data.creditScore.reason}</p>
                </div>
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="bg-white rounded-xl p-6 shadow-sm animate-slideUp" style={{animationDelay: "0.2s"}}>
              <h3 className="font-semibold text-lg mb-4">Recommendations to Improve</h3>
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
              <h3 className="font-semibold text-lg mb-4">Activity Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Total Transactions</p>
                  <p className="text-lg font-semibold text-gray-800">{creditData.data.analysis.transactionCount}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Total Volume</p>
                  <p className="text-lg font-semibold text-gray-800">{creditData.data.analysis.totalVolume.toFixed(2)} XLM</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Largest Transaction</p>
                  <p className="text-lg font-semibold text-gray-800">{creditData.data.analysis.largestTransaction.toFixed(2)} XLM</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Frequency</p>
                  <p className="text-lg font-semibold text-gray-800">{creditData.data.analysis.frequency.toFixed(2)}/day</p>
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
                  <h3 className="font-semibold text-lg ml-3">Professional Assessment</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">{creditData.data.englishRecommendation}</p>
                </div>
              </div>
            )}
            {creditData?.data?.englishRecommendation && (
              <div className="mt-6 bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
                <h4 className="font-medium text-blue-800 mb-2">Recommendation</h4>
                <p className="text-sm text-blue-900 italic">{creditData.data.englishRecommendation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditScoreSection; 