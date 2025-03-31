import React, { useState } from "react";
import { ChevronLeft, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFriendVault } from "@/context/FriendVaultContext";
import { useWeb3Auth } from "@/context/Web3AuthContext";
import Header from "./Header";
import AnimatedView from "@/components/ui/AnimatedView";
import { useNavigate } from "react-router-dom";
import VaultList from "./friend-vault/VaultList";
import CreateVaultScreen from "./friend-vault/CreateVaultScreen";
import VaultDetailsScreen from "./friend-vault/VaultDetailsScreen";
import DepositVaultScreen from "./friend-vault/DepositVaultScreen";
import WithdrawVaultScreen from "./friend-vault/WithdrawVaultScreen";
import EmptyVaultState from "./friend-vault/EmptyVaultState";

type View = "main" | "create" | "details" | "deposit" | "withdraw";

const FriendVaultScreen: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>("main");
  const [exitingView, setExitingView] = useState<string>("");
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  
  const { vaults, loading, loadVaults } = useFriendVault();
  const { userInfo } = useWeb3Auth();
  const navigate = useNavigate();

  // Manejar la navegación entre vistas
  const handleShowView = (view: View, vaultId?: string) => {
    if (vaultId) {
      setSelectedVaultId(vaultId);
    }
    
    setExitingView(currentView);
    setTimeout(() => {
      setExitingView("");
      setCurrentView(view);
    }, 300);
  };

  // Volver a la vista principal
  const handleBackToMain = () => {
    handleShowView("main");
  };

  // Volver a la pantalla de la wallet
  const handleBackToWallet = () => {
    navigate("/wallet");
  };

  // Refrescar la lista de vaults
  const handleRefresh = () => {
    loadVaults();
  };

  // Verificar si una vista está activa o saliendo
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

      {/* Vista principal */}
      {isViewActive("main") && (
        <div className={`relative z-10 flex flex-col w-full h-full transition-all duration-300 ${currentView === "main" ? 'opacity-100' : 'opacity-0'}`}>
          <Header 
            username={userInfo?.name || "Usuario"} 
            balance=""
            onSettingsClick={() => {}}
          />

          <div className="bg-white border flex flex-1 w-full flex-col p-4 rounded-t-[1.5rem] border-[rgba(237,237,237,1)] border-solid overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <Button variant="ghost" size="icon" onClick={handleBackToWallet}>
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <h2 className="text-xl font-semibold">Friend Vaults</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={handleRefresh}>
                  <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleShowView("create")}>
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Estado vacío o lista de vaults */}
            {vaults.length === 0 ? (
              <EmptyVaultState onCreateVault={() => handleShowView("create")} />
            ) : (
              <VaultList 
                vaults={vaults} 
                onSelectVault={(vaultId) => handleShowView("details", vaultId)} 
              />
            )}
          </div>
        </div>
      )}

      {/* Vista de creación de vault */}
      <AnimatedView show={isViewActive("create")} direction="right">
        <CreateVaultScreen onClose={handleBackToMain} />
      </AnimatedView>

      {/* Vista de detalles del vault */}
      <AnimatedView show={isViewActive("details")} direction="right">
        <VaultDetailsScreen 
          vaultId={selectedVaultId || ""} 
          onClose={handleBackToMain}
          onDeposit={() => handleShowView("deposit")}
          onWithdraw={() => handleShowView("withdraw")}
        />
      </AnimatedView>

      {/* Vista de depósito */}
      <AnimatedView show={isViewActive("deposit")} direction="right">
        <DepositVaultScreen 
          vaultId={selectedVaultId || ""} 
          onClose={() => handleShowView("details", selectedVaultId || "")}
        />
      </AnimatedView>

      {/* Vista de solicitud de retiro */}
      <AnimatedView show={isViewActive("withdraw")} direction="right">
        <WithdrawVaultScreen 
          vaultId={selectedVaultId || ""} 
          onClose={() => handleShowView("details", selectedVaultId || "")}
        />
      </AnimatedView>
    </div>
  );
};

export default FriendVaultScreen; 