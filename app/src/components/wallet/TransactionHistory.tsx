import React, { useState, useEffect } from "react";
import { ArrowDownRight, ArrowUpRight, Clock } from "lucide-react";
import { getTransactionHistory } from "@/utils/supabase";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface TransactionHistoryProps {
  address: string;
}

interface Transaction {
  id: string;
  from_address: string;
  to_address: string;
  amount: number;
  token_type: string;
  tx_hash: string;
  status: string;
  created_at: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ address }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const data = await getTransactionHistory(address);
        if (data) {
          setTransactions(data);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (address) {
      fetchTransactions();
    }
  }, [address]);

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true
      });
    } catch (e) {
      return "unknown date";
    }
  };

  // Format amount to maximum 4 decimal places
  const formatAmount = (amount: number) => {
    if (amount === 0) return "0";
    
    // Convert to string and check if it needs rounding
    const amountStr = amount.toString();
    if (!amountStr.includes('.')) return amountStr;
    
    const [whole, decimal] = amountStr.split('.');
    if (decimal.length <= 4) return amountStr;
    
    return `${whole}.${decimal.substring(0, 4)}`;
  };

  // Get token name from token_type
  const getTokenName = (tokenType: string) => {
    return tokenType.split("::").pop() || tokenType;
  };

  // Determina si el usuario es el remitente
  const isSender = (tx: Transaction) => tx.from_address.toLowerCase() === address.toLowerCase();

  // Shorten an address for display
  const shortenAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Loading transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="self-stretch flex flex-col w-full h-full overflow-y-auto p-3 space-y-3">
        <Clock className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500 text-center">
          No transactions to show. When you send or receive tokens, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="self-stretch flex flex-col w-full h-full overflow-y-auto p-3 space-y-3">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className={`flex items-center p-4 rounded-xl transition-colors ${
            isSender(tx) ? "bg-rose-50" : "bg-emerald-50"
          }`}
        >
          <div
            className={`flex items-center justify-center h-10 w-10 rounded-full mr-4 
              ${isSender(tx) ? "bg-rose-200 text-rose-500" : "bg-emerald-200 text-emerald-500"}`}
          >
            {isSender(tx) ? (
              <ArrowUpRight className="h-5 w-5" />
            ) : (
              <ArrowDownRight className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-sm">
                {isSender(tx) ? "Sent" : "Received"}
              </h4>
              <span
                className={`font-semibold text-sm ${
                  isSender(tx) ? "text-rose-500" : "text-emerald-500"
                }`}
              >
                {isSender(tx) ? "-" : "+"}{formatAmount(tx.amount)} {getTokenName(tx.token_type)}
              </span>
            </div>

            <div className="flex justify-between items-end mt-1">
              <span className="text-xs text-gray-500 truncate">
                {isSender(tx)
                  ? `To: ${shortenAddress(tx.to_address)}`
                  : `From: ${shortenAddress(tx.from_address)}`}
              </span>
              <span className="text-xs text-gray-400">
                {formatTime(tx.created_at)}
              </span>
            </div>
          </div>
          
          <div className="ml-2">
            {tx.status === "success" ? (
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                Completed
              </span>
            ) : tx.status === "pending" ? (
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                Pending
              </span>
            ) : (
              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                Failed
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionHistory;