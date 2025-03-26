import { StartScreen } from "@/components/start-screen/StartScreen";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { isLoggedIn, isInitialized } = useWeb3Auth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && isLoggedIn) {
      navigate("/wallet");
    }
  }, [isLoggedIn, isInitialized, navigate]);

  return (
    <main className="h-[100dvh] flex items-center justify-center bg-gray-100">
      <StartScreen />
    </main>
  );
};

export default Index;
