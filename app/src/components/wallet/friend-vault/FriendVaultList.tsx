import React, { useEffect } from 'react';
import { Plus, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFriendVault } from '@/context/FriendVaultContext';
import VaultList from './VaultList';

const FriendVaultList: React.FC = () => {
  const { vaults, loadVaults, loading } = useFriendVault();
  
  useEffect(() => {
    loadVaults();
  }, [loadVaults]);

  const handleCreateVault = () => {
    // En un caso real, esto abriría el formulario de creación
    // pero por ahora simplemente recargaremos la lista
    console.log('Create new vault');
  };

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-4 px-4">
        <h2 className="text-xl font-semibold">Friend Vaults</h2>
        <Button variant="outline" size="sm" onClick={handleCreateVault}>
          <Plus className="h-4 w-4 mr-2" />
          New Vault
        </Button>
      </div>
      
      <div className="px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-2 text-gray-500">Loading vaults...</p>
          </div>
        ) : vaults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <ShieldAlert className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No vaults yet</h3>
            <p className="text-gray-500 mb-6 text-center">
              Create a vault to share funds with friends and family securely
            </p>
            <Button onClick={handleCreateVault}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first Vault
            </Button>
          </div>
        ) : (
          <VaultList 
            vaults={vaults} 
            onSelectVault={(vaultId) => console.log('Selected vault:', vaultId)} 
          />
        )}
      </div>
    </div>
  );
};

export default FriendVaultList; 