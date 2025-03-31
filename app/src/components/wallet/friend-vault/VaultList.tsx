import React from 'react';
import { FriendVault } from '@/services/friendVaultService';
import { ChevronRight, Users, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VaultListProps {
  vaults: FriendVault[];
  onSelectVault: (vaultId: string) => void;
}

const VaultList: React.FC<VaultListProps> = ({ vaults, onSelectVault }) => {
  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
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
              <span className="text-sm">{vault.members.length} miembros</span>
            </div>
            <div className="text-sm text-gray-500">
              Creado el {formatDate(vault.createdAt)}
            </div>
          </div>
          
          <div className="flex justify-between items-end mt-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "rounded-full p-2",
                vault.isCreator ? "bg-blue-100" : "bg-gray-100"
              )}>
                <Wallet className={cn(
                  "h-4 w-4",
                  vault.isCreator ? "text-blue-600" : "text-gray-600"
                )} />
              </div>
              <div className="text-sm">
                <div className="text-gray-500">
                  {vault.isCreator ? 'Creador' : 'Miembro'}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-semibold">{formatBalance(vault.balance)} XLM</div>
              <div className="text-xs text-gray-500">
                ~${(parseFloat(formatBalance(vault.balance)) * 0.11).toFixed(2)} USD
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VaultList; 