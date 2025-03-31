import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface CreditScoreProps {
  score: number;
  reason: string;
  debtRatio?: number;
  transactionCount?: number;
  loading: boolean;
  onClick?: () => void;
  debug?: boolean;
}

const CreditScoreCard: React.FC<CreditScoreProps> = ({ 
  score, 
  reason, 
  debtRatio, 
  transactionCount, 
  loading, 
  onClick,
  debug = false
}) => {
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
    <Card className={`w-full shadow-md hover:shadow-lg transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      {debug && (
        <div className="text-xs text-gray-400 p-2 border-b border-gray-100">
          Debug: Score={score}, Trans={transactionCount}, Ratio={debtRatio}
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Credit Score</span>
          {loading && (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          )}
        </CardTitle>
        <CardDescription>Based on your transaction history</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-1">
        <div className="w-28 h-28 relative mb-3">
          {!loading ? (
            <div className="w-full h-full rounded-full border-8 flex items-center justify-center" style={{ borderColor: getScoreColor(score) }}>
              <span className="text-2xl font-bold" style={{ color: getScoreColor(score) }}>
                {score}
              </span>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300">
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
        {!loading && (
          <>
            <div className="flex flex-col items-center mt-1">
              <span className="text-lg font-semibold" style={{ color: getScoreColor(score) }}>
                {getScoreRating(score)}
              </span>
              <p className="text-xs text-gray-500 text-center mt-1 line-clamp-2">
                {reason}
              </p>
            </div>
            
            {(debtRatio !== undefined || transactionCount !== undefined) && (
              <div className="w-full mt-3 border-t pt-3 grid grid-cols-2 gap-2">
                {transactionCount !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Transactions</p>
                    <p className="text-sm font-semibold">{transactionCount}</p>
                  </div>
                )}
                {debtRatio !== undefined && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Debt Ratio</p>
                    <p className="text-sm font-semibold">{debtRatio.toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
      {!loading && (
        <CardFooter className="flex justify-center pb-4 pt-0">
          <div className="text-xs text-blue-600 flex items-center">
            <span>View details</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 ml-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default CreditScoreCard; 