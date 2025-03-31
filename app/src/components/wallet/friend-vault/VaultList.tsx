import React from 'react';
import { ChevronRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// Definimos la interfaz para un Vault
interface FriendVault {
  id: string;
  name: string;
  description?: string;
  publicKey: string;
  createdBy: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
  balance: string;
}

interface VaultListProps {
  vaults: FriendVault[];
  onSelectVault: (vaultId: string) => void;
}

const VaultList: React.FC<VaultListProps> = ({ vaults, onSelectVault }) => {
  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Función para formatear el balance
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  return (
    <div className="flex flex-col gap-3">
      {vaults.map((vault) => (
        <div 
          key={vault.id}
          onClick={() => onSelectVault(vault.id)}
          className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-200"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-lg">{vault.name}</h3>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-gray-500">
              <Users className="h-4 w-4" />
              <span className="text-sm">{vault.members.length} members</span>
            </div>
            <div className="text-sm text-gray-500">
              Created {formatDate(vault.createdAt)}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {vault.createdBy === vault.members[0] ? 'You are the owner' : 'You are a member'}
            </div>
            <div className="font-medium">
              {formatBalance(vault.balance)} XLM
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VaultList; 