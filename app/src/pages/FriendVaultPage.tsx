import React from 'react';
import { useWeb3Auth } from '@/context/Web3AuthContext';
import { FriendVaultProvider } from '@/context/FriendVaultContext';
import FriendVaultScreen from '@/components/wallet/FriendVaultScreen';
import { Navigate } from 'react-router-dom';

const FriendVaultPage: React.FC = () => {
  const { userInfo, isLoading } = useWeb3Auth();

  // Redirigir a la página principal si el usuario no está autenticado
  if (!isLoading && !userInfo) {
    return <Navigate to="/" />;
  }

  // Mostrar pantalla de carga si está cargando
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <FriendVaultProvider>
      <FriendVaultScreen />
    </FriendVaultProvider>
  );
};

export default FriendVaultPage; 