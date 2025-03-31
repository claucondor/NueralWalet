import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { friendVaultService, FriendVault, WithdrawalRequest } from '@/services/friendVaultService';
import { useWeb3Auth } from './Web3AuthContext';
import { useToast } from '@/components/ui/use-toast';

// Extender la interfaz FriendVault para incluir withdrawalRequests
interface FriendVaultWithRequests extends FriendVault {
  withdrawalRequests?: WithdrawalRequest[];
}

interface FriendVaultContextType {
  vaults: FriendVault[];
  loading: boolean;
  selectedVault: FriendVaultWithRequests | null;
  withdrawalRequests: WithdrawalRequest[];
  loadVaults: () => Promise<void>;
  loadVaultDetails: (vaultId: string) => Promise<void>;
  createVault: (name: string, description: string, memberEmails: string[]) => Promise<boolean>;
  depositToVault: (vaultId: string, amount: string, tokenAddress?: string) => Promise<boolean>;
  requestWithdrawal: (vaultId: string, amount: string, recipient: string, tokenAddress?: string) => Promise<boolean>;
  voteOnWithdrawal: (requestId: string, vote: 'approve' | 'reject') => Promise<boolean>;
  executeWithdrawal: (requestId: string) => Promise<boolean>;
  checkEmail: (email: string) => Promise<boolean>;
}

const FriendVaultContext = createContext<FriendVaultContextType | undefined>(undefined);

export const useFriendVault = () => {
  const context = useContext(FriendVaultContext);
  if (!context) {
    throw new Error('useFriendVault debe ser usado dentro de un FriendVaultProvider');
  }
  return context;
};

interface FriendVaultProviderProps {
  children: ReactNode;
}

export const FriendVaultProvider: React.FC<FriendVaultProviderProps> = ({ children }) => {
  const [vaults, setVaults] = useState<FriendVault[]>([]);
  const [selectedVault, setSelectedVault] = useState<FriendVaultWithRequests | null>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const { userInfo, stellarAccount } = useWeb3Auth();
  const { toast } = useToast();

  // Cargar los vaults del usuario
  const loadVaults = async () => {
    if (!userInfo?.email) return;
    
    setLoading(true);
    try {
      const userVaults = await friendVaultService.getVaultsByUser(userInfo.email);
      setVaults(userVaults);
      
      // Log para depuración
      console.log(`📋 Vaults cargados: ${userVaults.length}`, userVaults);
      
      if (userVaults.length === 0) {
        console.log('ℹ️ No se encontraron vaults para este usuario');
      }
    } catch (error) {
      console.error('❌ Error al cargar vaults:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los vaults',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar detalles de un vault específico
  const loadVaultDetails = async (vaultId: string) => {
    if (!userInfo?.email) return;
    
    setLoading(true);
    try {
      const vault = await friendVaultService.getVaultDetails(vaultId, userInfo.email) as FriendVaultWithRequests;
      setSelectedVault(vault);
      setWithdrawalRequests(vault.withdrawalRequests || []);
    } catch (error) {
      console.error('Error al cargar detalles del vault:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los detalles del vault',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear un nuevo vault
  const createVault = async (name: string, description: string, memberEmails: string[]): Promise<boolean> => {
    if (!userInfo?.email) return false;
    
    setLoading(true);
    try {
      await friendVaultService.createVault({
        name,
        description,
        creatorEmail: userInfo.email,
        memberEmails,
      });
      
      toast({
        title: 'Éxito',
        description: 'Vault creado exitosamente',
      });
      
      await loadVaults();
      return true;
    } catch (error) {
      console.error('Error al crear vault:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el vault',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Depositar en un vault
  const depositToVault = async (vaultId: string, amount: string, tokenAddress?: string): Promise<boolean> => {
    if (!userInfo?.email || !stellarAccount?.secretKey) return false;
    
    setLoading(true);
    try {
      await friendVaultService.depositToVault({
        vaultId,
        amount,
        tokenAddress,
        senderPrivateKey: stellarAccount.secretKey,
        senderEmail: userInfo.email,
      });
      
      toast({
        title: 'Éxito',
        description: 'Depósito realizado exitosamente',
      });
      
      if (selectedVault) {
        await loadVaultDetails(vaultId);
      }
      
      return true;
    } catch (error) {
      console.error('Error al depositar en vault:', error);
      toast({
        title: 'Error',
        description: 'No se pudo realizar el depósito',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Solicitar un retiro
  const requestWithdrawal = async (vaultId: string, amount: string, recipient: string, tokenAddress?: string): Promise<boolean> => {
    if (!userInfo?.email) return false;
    
    setLoading(true);
    try {
      await friendVaultService.requestWithdrawal({
        vaultId,
        amount,
        recipient,
        tokenAddress,
        requestedBy: userInfo.email,
      });
      
      toast({
        title: 'Éxito',
        description: 'Solicitud de retiro creada exitosamente',
      });
      
      if (selectedVault) {
        await loadVaultDetails(vaultId);
      }
      
      return true;
    } catch (error) {
      console.error('Error al solicitar retiro:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la solicitud de retiro',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Votar en una solicitud de retiro
  const voteOnWithdrawal = async (requestId: string, vote: 'approve' | 'reject'): Promise<boolean> => {
    if (!userInfo?.email) return false;
    
    setLoading(true);
    try {
      await friendVaultService.voteOnWithdrawal({
        requestId,
        voterEmail: userInfo.email,
        vote,
      });
      
      toast({
        title: 'Éxito',
        description: `Voto ${vote === 'approve' ? 'aprobado' : 'rechazado'} exitosamente`,
      });
      
      if (selectedVault) {
        await loadVaultDetails(selectedVault.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error al votar en solicitud:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar el voto',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar un retiro aprobado
  const executeWithdrawal = async (requestId: string): Promise<boolean> => {
    if (!userInfo?.email) return false;
    
    setLoading(true);
    try {
      await friendVaultService.executeWithdrawal({
        requestId,
        executorEmail: userInfo.email,
      });
      
      toast({
        title: 'Éxito',
        description: 'Retiro ejecutado exitosamente',
      });
      
      if (selectedVault) {
        await loadVaultDetails(selectedVault.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error al ejecutar retiro:', error);
      toast({
        title: 'Error',
        description: 'No se pudo ejecutar el retiro',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Verificar si un email existe
  const checkEmail = async (email: string): Promise<boolean> => {
    try {
      return await friendVaultService.checkEmail(email);
    } catch (error) {
      console.error('Error al verificar email:', error);
      return false;
    }
  };

  // Cargar vaults iniciales
  useEffect(() => {
    if (userInfo?.email) {
      loadVaults();
    }
  }, [userInfo?.email]);

  const value = {
    vaults,
    loading,
    selectedVault,
    withdrawalRequests,
    loadVaults,
    loadVaultDetails,
    createVault,
    depositToVault,
    requestWithdrawal,
    voteOnWithdrawal,
    executeWithdrawal,
    checkEmail,
  };

  return (
    <FriendVaultContext.Provider value={value}>
      {children}
    </FriendVaultContext.Provider>
  );
}; 