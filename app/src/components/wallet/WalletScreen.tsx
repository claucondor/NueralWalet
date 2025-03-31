import React, { useState, useEffect } from "react";
import Header from "./Header";
import Tabs from "./Tabs";
import TokensList from "./TokensList";
import ActionButtons from "./ActionButtons";
import ChatInput from "./ChatInput";
import ChatScreen from "./ChatScreen";
import SendScreen from "./SendScreen";
import ReceiveScreen from "./ReceiveScreen";
import DepositScreen from "./DepositScreen";
import SwapScreen from "./SwapScreen";
import SettingsScreen from "./SettingsScreen";
import AnimatedView from "@/components/ui/AnimatedView";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import { requestTestnetXLM } from "@/utils/stellar"; // Actualizado a Stellar
import TransactionHistory from "./TransactionHistory";
import FriendVaultScreen from "./friend-vault/FriendVaultScreen";
import { FriendVaultProvider } from "@/context/FriendVaultContext";

const WalletScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tokens");
  const [currentView, setCurrentView] = useState<"main" | "send" | "receive" | "deposit" | "swap" | "settings" | "chat">("main");
  const [exitingView, setExitingView] = useState("");
  const [mainViewVisible, setMainViewVisible] = useState(true);
  const { stellarBalance, stellarAddress, userInfo, getBalance, stellarAccount, logout } = useWeb3Auth(); // Actualizado a Stellar

  // Format the balance to a human-readable format
  const formatBalance = (balance: number) => {
    // XLM tiene 7 decimales
    if (isNaN(balance) || balance === undefined || balance === null) return '0.0000';
    return balance.toFixed(4);
  };

  // Format USD value (tasa de cambio actual: 1 XLM = $0.11)
  const getUsdValue = (balance: number) => {
    if (isNaN(balance) || balance === undefined || balance === null) return '0.00';
    const usdValue = balance * 0.11; // Precio actual de XLM
    return usdValue.toFixed(2);
  };

  useEffect(() => {
    // Refresh balance when component mounts
    console.log('WalletScreen montado, obteniendo balance inicial');
    getBalance();
    
    // Set up interval to refresh balance every 30 seconds
    const intervalId = setInterval(() => {
      console.log('Actualizando balance por intervalo');
      getBalance();
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [getBalance]);

  // Effect to show the main view animation when mounted
  useEffect(() => {
    setMainViewVisible(true);
  }, []);

  // Para depuración
  useEffect(() => {
    console.log('Stellar Balance actualizado:', stellarBalance);
  }, [stellarBalance]);

  // Calculamos el valor total en USD (solo se utilizará para el encabezado)
  const totalUsdBalance = getUsdValue(stellarBalance);
  
  // Para depuración
  console.log('Header mostrado con balance USD:', totalUsdBalance);

  // Enhanced view transition management
  const handleShowView = (view: "main" | "send" | "receive" | "deposit" | "swap" | "settings" | "chat") => {
    if (view === "main") {
      // Hide current view (non-main)
      setExitingView(currentView);
      setMainViewVisible(false);
      
      // After a brief delay, update view and show main
      setTimeout(() => {
        setExitingView("");
        setCurrentView("main");
        setMainViewVisible(true);
      }, 20); // Increased duration for smoother transition
    } else if (currentView !== "main") {
      // If there's already a different view than main, first hide it with animation
      setExitingView(currentView);
      setCurrentView("main");
      setMainViewVisible(true);
      
      // After a brief delay for transition, show the new view
      setTimeout(() => {
        setExitingView("");
        setMainViewVisible(false);
        setCurrentView(view);
      }, 1200); // Increased duration for smoother transition
    } else {
      // If we're in the main view, animate exit and show new view
      setMainViewVisible(false);
      setTimeout(() => {
        setCurrentView(view);
      }, 20); // Increased duration for smoother transition
    }
  };

  // Handle sending message in chat
  const handleSendMessage = (message: string) => {
    console.log("Sending message:", message);
    handleShowView("chat");
  };

  // Handle wallet action buttons
  const handleActionButton = async (action: string) => {
    console.log(`${action} button clicked`);
    
    switch (action) {
      case "Send":
        handleShowView("send");
        break;
      case "Receive":
        handleShowView("receive");
        break;
      case "Deposit":
        handleShowView("deposit");
        break;
      case "Swap":
        handleShowView("swap");
        break;
      case "Settings":
        handleShowView("settings");
        break;
      case "Chat":
        handleShowView("chat");
        break;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  // Check if a view is active or exiting (for animations)
  const isViewActive = (view: string) => {
    return currentView === view || exitingView === view;
  };

  return (
    <div className="bg-gray-50 flex flex-col h-[100dvh] w-full overflow-hidden fixed inset-0">
      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/bg/header-bg.webm" type="video/webm" />
        </video>
      </div>

      {/* Main view with animation */}
      {currentView === "main" && (
        <div className={`relative z-10 flex flex-col items-center w-full h-full transition-all duration-1000 transform ${mainViewVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Header 
            username={userInfo?.name || "User"} 
            balance={`$${totalUsdBalance}`}
            onSettingsClick={() => handleActionButton("Settings")}
          />

          <div className="bg-white border flex flex-1 w-full flex-col items-center p-3 rounded-t-[1.5rem] border-[rgba(237,237,237,1)] border-solid overflow-y-auto mb-[50px]">
            <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === "tokens" ? (
              <div className="w-full flex-1 flex flex-col">
                <TokensList />
                <ActionButtons 
                  onSend={() => handleActionButton("Send")} 
                  onReceive={() => handleActionButton("Receive")} 
                  onDeposit={() => handleActionButton("Deposit")} 
                  onSwap={() => handleActionButton("Swap")} 
                />
              </div>
            ) : activeTab === "history" ? (
              <div className="self-stretch flex-1 w-full overflow-auto">
                <TransactionHistory address={stellarAddress} />
              </div>
            ) : activeTab === "friendvault" ? (
              <div className="self-stretch flex-1 w-full overflow-auto">
                <FriendVaultProvider>
                  <FriendVaultScreen />
                </FriendVaultProvider>
              </div>
            ) : null}
          </div>

          <ChatInput 
            onSendMessage={handleSendMessage} 
            onInputClick={() => handleActionButton("Chat")}
          />
        </div>
      )}

      {/* Animated views */}
      <AnimatedView show={isViewActive("send")} direction="right">
        <SendScreen onClose={() => handleShowView("main")} />
      </AnimatedView>
      
      <AnimatedView show={isViewActive("receive")} direction="right">
        <ReceiveScreen onClose={() => handleShowView("main")} />
      </AnimatedView>
      
      <AnimatedView show={isViewActive("deposit")} direction="right">
        <DepositScreen onClose={() => handleShowView("main")} />
      </AnimatedView>
      
      <AnimatedView show={isViewActive("swap")} direction="right">
        <SwapScreen onClose={() => handleShowView("main")} />
      </AnimatedView>
      
      <AnimatedView show={isViewActive("settings")} direction="right">
        <SettingsScreen onClose={() => handleShowView("main")} onLogout={handleLogout} />
      </AnimatedView>
      
      <AnimatedView show={isViewActive("chat")} direction="right">
        <ChatScreen onClose={() => handleShowView("main")} walletAddress={stellarAddress} />
      </AnimatedView>
    </div>
  );
};

export default WalletScreen;