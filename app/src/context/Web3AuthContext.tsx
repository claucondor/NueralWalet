import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { clientId, privateKeyProvider, web3AuthNetwork } from '../config/web3auth';
import { StellarAdapter } from '../lib/StellarAdapter';
import { CHAIN_NAMESPACES } from '@web3auth/base';

// Definir la interfaz KeyPair localmente
interface KeyPair {
  publicKey: string;
  secretKey: string;
}

// Definir interfaz para la información del usuario
interface UserInfo {
  name: string;
  email: string;
  profileImage: string;
  verifier: string;
  verifierId: string;
}

interface Web3AuthContextType {
  web3auth: Web3Auth | null;
  isInitialized: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  stellarAccount: KeyPair | null;
  stellarAddress: string;
  stellarBalance: number;
  userInfo: UserInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getBalance: () => Promise<void>;
  getPrivateKey: () => Promise<string | null>;
}

const Web3AuthContext = createContext<Web3AuthContextType>({} as Web3AuthContextType);

export const useWeb3Auth = () => useContext(Web3AuthContext);

interface Web3AuthProviderProps {
  children: ReactNode;
}

export const Web3AuthProvider = ({ children }: Web3AuthProviderProps) => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stellarAccount, setStellarAccount] = useState<KeyPair | null>(null);
  const [stellarAddress, setStellarAddress] = useState('');
  const [stellarBalance, setStellarBalance] = useState(0);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const web3authInstance = new Web3Auth({
          clientId, 
          web3AuthNetwork,
          privateKeyProvider,
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.OTHER,
            chainId: "0x1", // Usamos un valor genérico
            // Configuración para acceder desde Web3Auth
            rpcTarget: "https://horizon-testnet.stellar.org",
            displayName: "Stellar Testnet",
            blockExplorerUrl: "https://stellar.expert/explorer/testnet",
            ticker: "XLM",
            tickerName: "Stellar Lumens",
          },
        });

        setWeb3auth(web3authInstance);

        await web3authInstance.initModal();
        setIsInitialized(true);

        if (web3authInstance.connected) {
          setIsLoggedIn(true);
          await getUserInfo(web3authInstance);
        }
      } catch (error) {
        console.error('Error initializing Web3Auth:', error);
      }
    };

    init();
  }, []);

  const getUserInfo = async (web3authInstance: Web3Auth) => {
    if (!web3authInstance.provider) return;

    try {
      const privateKey = await web3authInstance.provider.request({
        method: 'private_key',
      }) as string;

      // Generar cuenta Stellar a partir de la clave EVM
      const { stellarAccount: account, stellarAccountAddress } = StellarAdapter.getAccount(privateKey);
      
      setStellarAccount(account);
      setStellarAddress(stellarAccountAddress);

      // Obtener información del usuario
      try {
        const user = await web3authInstance.getUserInfo();
        const userEmail = user.email || '';
        
        setUserInfo({
          name: user.name || 'Anonymous User',
          email: userEmail,
          profileImage: user.profileImage || '',
          verifier: user.verifier || '',
          verifierId: user.verifierId || '',
        });
        
        // Guardar datos del usuario en Supabase si tenemos email y dirección
        if (userEmail && stellarAccountAddress) {
          try {
            // Guardar ambas claves (EVM y Stellar)
            const success = await StellarAdapter.saveUserWithKeys(
              userEmail,
              privateKey,
              account
            );
            
            if (!success) {
              console.error('Error al guardar las claves en Supabase');
            } else {
              console.log('Claves guardadas con éxito');
              
              // Crear cuenta en Stellar si es necesario (financiación inicial)
              try {
                // Verificar si la cuenta existe comprobando el balance
                const balance = await StellarAdapter.getBalance(stellarAccountAddress);
                
                // Si no existe la cuenta (balance = 0), solicitamos fondos del faucet
                if (balance === 0) {
                  console.log('Cuenta Stellar nueva, solicitando fondos del faucet...');
                  await StellarAdapter.requestAirdrop(stellarAccountAddress);
                }
              } catch (error) {
                console.error('Error al crear/financiar cuenta Stellar:', error);
              }
            }
          } catch (error) {
            console.error('Error saving user data to Supabase:', error);
          }
        }
      } catch (error) {
        console.error('Error getting user info, using default values:', error);
        setUserInfo({
          name: 'Anonymous User',
          email: '',
          profileImage: '',
          verifier: '',
          verifierId: '',
        });
      }

      // Get balance
      await getBalance();
    } catch (error) {
      console.error('Error getting user info:', error);
    }
  };

  const login = async () => {
    if (!web3auth) {
      console.error('Web3Auth not initialized');
      return;
    }

    setIsLoading(true);
    try {
      await web3auth.connect();
      setIsLoggedIn(true);
      await getUserInfo(web3auth);
    } catch (error) {
      console.error('Error logging in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!web3auth) {
      console.error('Web3Auth not initialized');
      return;
    }

    setIsLoading(true);
    try {
      await web3auth.logout();
      setIsLoggedIn(false);
      setStellarAccount(null);
      setStellarAddress('');
      setStellarBalance(0);
      setUserInfo(null);
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBalance = async () => {
    if (!stellarAddress) return;
    
    try {
      const balance = await StellarAdapter.getBalance(stellarAddress);
      setStellarBalance(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
    }
  };

  const getPrivateKey = async (): Promise<string | null> => {
    if (!web3auth || !web3auth.provider) {
      console.error('Web3Auth not initialized or not connected');
      return null;
    }

    try {
      const privateKey = await web3auth.provider.request({
        method: 'private_key',
      }) as string;
      
      return privateKey;
    } catch (error) {
      console.error('Error getting private key:', error);
      return null;
    }
  };

  return (
    <Web3AuthContext.Provider
      value={{
        web3auth,
        isInitialized,
        isLoading,
        isLoggedIn,
        stellarAccount,
        stellarAddress,
        stellarBalance,
        userInfo,
        login,
        logout,
        getBalance,
        getPrivateKey,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
};