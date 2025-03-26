import React, { useEffect } from "react";
import WalletScreen from "@/components/wallet/WalletScreen";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { useNavigate } from "react-router-dom";
import Spinner from "@/components/common/Spinner";

const WalletPage: React.FC = () => {
  const { isLoggedIn, isInitialized, isLoading } = useWeb3Auth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && !isLoggedIn && !isLoading) {
      navigate("/");
    }
  }, [isLoggedIn, isInitialized, isLoading, navigate]);

  // Show loading spinner while checking login state
  if (isLoading || !isInitialized) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-gray-100">
        <Spinner />
      </div>
    );
  }

  // Only render the wallet screen if the user is logged in
  if (!isLoggedIn) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <WalletScreen />
    </div>
  );
};

export default WalletPage;
