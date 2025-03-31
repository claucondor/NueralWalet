import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface EmptyVaultStateProps {
  onCreateVault: () => void;
}

const EmptyVaultState: React.FC<EmptyVaultStateProps> = ({ onCreateVault }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-[60vh] p-4">
      <div className="rounded-full bg-blue-100 p-6 mb-6">
        <PlusCircle className="h-12 w-12 text-blue-500" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">No tienes Friend Vaults</h3>
      
      <p className="text-gray-500 mb-8 max-w-md">
        Un Friend Vault es una cartera compartida donde tú y tus amigos pueden ahorrar juntos.
        Ideal para viajes, regalos grupales o cualquier meta compartida.
      </p>
      
      <Button onClick={onCreateVault} className="gap-2">
        <PlusCircle className="h-5 w-5" />
        Crear mi primer Friend Vault
      </Button>
    </div>
  );
};

export default EmptyVaultState; 