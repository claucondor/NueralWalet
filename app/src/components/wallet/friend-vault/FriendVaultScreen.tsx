import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useFriendVault } from '@/context/FriendVaultContext';
import CreateVaultScreen from './CreateVaultScreen';
import VaultDetailsScreen from './VaultDetailsScreen';
import DepositVaultScreen from './DepositVaultScreen';
import WithdrawVaultScreen from './WithdrawVaultScreen';

enum ScreenState {
  LIST = 'list',
  CREATE = 'create',
  DETAILS = 'details',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw'
}

const FriendVaultScreen: React.FC = () => {
  const [screenState, setScreenState] = useState<ScreenState>(ScreenState.LIST);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { vaults, loadVaults, loading } = useFriendVault();
  
  useEffect(() => {
    loadVaults();
  }, [loadVaults]);

  const handleVaultClick = (vaultId: string) => {
    setSelectedVaultId(vaultId);
    setScreenState(ScreenState.DETAILS);
  };

  const handleCreateVault = () => {
    setScreenState(ScreenState.CREATE);
  };

  const handleCloseSubScreen = () => {
    setScreenState(ScreenState.LIST);
    loadVaults(); // Recargar la lista de vaults
  };

  const handleDeposit = (vaultId: string) => {
    setSelectedVaultId(vaultId);
    setScreenState(ScreenState.DEPOSIT);
  };

  const handleWithdraw = (vaultId: string) => {
    setSelectedVaultId(vaultId);
    setScreenState(ScreenState.WITHDRAW);
  };

  // Función para formatear el balance
  const formatBalance = (balance?: string) => {
    if (!balance || isNaN(parseFloat(balance))) return '0.0000';
    return parseFloat(balance).toFixed(4);
  };

  // Renderizar la pantalla adecuada según el estado
  const renderScreen = () => {
    switch (screenState) {
      case ScreenState.CREATE:
        return <CreateVaultScreen onClose={handleCloseSubScreen} />;
      
      case ScreenState.DETAILS:
        if (!selectedVaultId) return null;
        return (
          <VaultDetailsScreen 
            vaultId={selectedVaultId} 
            onClose={handleCloseSubScreen}
            onDeposit={() => handleDeposit(selectedVaultId)}
            onWithdraw={() => handleWithdraw(selectedVaultId)}
          />
        );
      
      case ScreenState.DEPOSIT:
        if (!selectedVaultId) return null;
        return (
          <DepositVaultScreen 
            vaultId={selectedVaultId} 
            onClose={handleCloseSubScreen}
          />
        );
      
      case ScreenState.WITHDRAW:
        if (!selectedVaultId) return null;
        return (
          <WithdrawVaultScreen 
            vaultId={selectedVaultId} 
            onClose={handleCloseSubScreen}
          />
        );
      
      case ScreenState.LIST:
      default:
        return (
          <div className="flex flex-col h-full w-full overflow-hidden bg-white">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Friend Vaults</h2>
              <Button variant="outline" size="sm" onClick={handleCreateVault}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Vault
              </Button>
            </div>

            {/* Vault List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <p className="mt-2 text-gray-500">Cargando vaults...</p>
                </div>
              ) : vaults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <ShieldAlert className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tienes vaults todavía</h3>
                  <p className="text-gray-500 mb-6">
                    Crea un vault para compartir fondos con amigos y familiares de forma segura
                  </p>
                  <Button onClick={handleCreateVault}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear tu primer Vault
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {vaults.map((vault) => (
                    <div 
                      key={vault.id} 
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleVaultClick(vault.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{vault.name}</h3>
                          <div className="text-sm text-gray-500">
                            {vault.members.length} {vault.members.length === 1 ? 'miembro' : 'miembros'}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="text-right mr-3">
                            <div className="font-medium">{formatBalance(vault.balance)} XLM</div>
                            {/* Agrega aquí la lógica para mostrar solicitudes pendientes si es necesario */}
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return renderScreen();
};

export default FriendVaultScreen; 