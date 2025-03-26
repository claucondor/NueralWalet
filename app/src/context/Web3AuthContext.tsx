import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { clientId, privateKeyProvider, web3AuthNetwork } from '../config/web3auth';
import { CHAIN_NAMESPACES } from '@web3auth/base';
// Importar StellarWalletKit con ruta relativa correcta
import { StellarWalletKit } from '../../../stellar-kit';
import * as StellarSdk from '@stellar/stellar-sdk';

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

// Extender la interfaz para incluir el stellar-kit
interface Web3AuthContextType {
  web3auth: Web3Auth | null;
  isInitialized: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  stellarAccount: KeyPair | null;
  stellarAddress: string;
  stellarBalance: number;
  userInfo: UserInfo | null;
  stellarKit: StellarWalletKit | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getBalance: () => Promise<void>;
  getPrivateKey: () => Promise<string | null>;
  // Nuevos métodos para Stellar Kit
  loadToken: (contractId: string) => Promise<any>;
  getTokenBalance: (contractId: string, address?: string) => Promise<any>;
  sendPayment: (destination: string, amount: string, asset?: string, memo?: string) => Promise<any>;
}

const Web3AuthContext = createContext<Web3AuthContextType>({} as Web3AuthContextType);

export const useWeb3Auth = () => useContext(Web3AuthContext);

interface Web3AuthProviderProps {
  children: ReactNode;
}

// Función auxiliar para derivar una cuenta Stellar a partir de una clave privada EVM
const getAccountFromPrivateKey = (privateKey: string): { stellarAccount: KeyPair, stellarAccountAddress: string } => {
  try {
    // Eliminar '0x' si está presente
    const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey.substring(2) : privateKey;
    
    // Crear un keypair derivado (esto es simplificado y debería adaptarse según tus necesidades)
    const seed = Buffer.from(cleanPrivateKey.padEnd(64, '0').slice(0, 64), 'hex');
    const keypair = StellarSdk.Keypair.fromRawEd25519Seed(seed);
    
    return {
      stellarAccount: {
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret()
      },
      stellarAccountAddress: keypair.publicKey()
    };
  } catch (error) {
    console.error('Error al derivar cuenta Stellar:', error);
    throw error;
  }
};

// Función auxiliar para guardar claves en Supabase (reemplazo simple)
const saveUserWithKeys = async (email: string, evmKey: string, stellarAccount: KeyPair): Promise<boolean> => {
  try {
    // Aquí se implementaría la lógica para guardar en Supabase
    console.log('Guardando claves para usuario:', email);
    // Por simplicidad, devolvemos true para simular éxito
    return true;
  } catch (error) {
    console.error('Error al guardar claves:', error);
    return false;
  }
};

export const Web3AuthProvider = ({ children }: Web3AuthProviderProps) => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stellarAccount, setStellarAccount] = useState<KeyPair | null>(null);
  const [stellarAddress, setStellarAddress] = useState('');
  const [stellarBalance, setStellarBalance] = useState(0);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  // Agregar estado para StellarWalletKit
  const [stellarKit, setStellarKit] = useState<StellarWalletKit | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Inicializar StellarWalletKit (usando testnet)
        const walletKit = new StellarWalletKit(true);
        setStellarKit(walletKit);

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
    if (!web3authInstance.provider || !stellarKit) return;

    try {
      const privateKey = await web3authInstance.provider.request({
        method: 'private_key',
      }) as string;

      // Generar cuenta Stellar a partir de la clave EVM
      const { stellarAccount: account, stellarAccountAddress } = getAccountFromPrivateKey(privateKey);
      
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
            const success = await saveUserWithKeys(
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
                // Usar stellarKit para verificar si la cuenta existe y obtener balance
                const accountInfo = await stellarKit.getAccountInfo(stellarAccountAddress);
                
                // Si no existe la cuenta, solicitamos fondos del faucet
                if (!accountInfo) {
                  console.log('Cuenta Stellar nueva, solicitando fondos del faucet...');
                  // Usar stellarKit para fondear la cuenta
                  const fundResult = await stellarKit.fundAccountWithFriendbot(stellarAccountAddress);
                  
                  if (fundResult.success) {
                    console.log('Cuenta fondeada exitosamente:', fundResult.hash);
                  } else {
                    console.error('Error al fondear la cuenta:', fundResult.error);
                  }
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
    if (!stellarAddress || !stellarKit) return;
    
    try {
      // Usar stellarKit para obtener balance
      const accountInfo = await stellarKit.getAccountInfo(stellarAddress);
      if (accountInfo && accountInfo.balance) {
        setStellarBalance(parseFloat(accountInfo.balance));
      }
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

  // Nuevos métodos para trabajar con tokens usando StellarKit
  const loadToken = async (contractId: string) => {
    if (!stellarKit || !stellarAccount) {
      console.error('StellarKit no inicializado o usuario no autenticado');
      return null;
    }

    try {
      const tokenInfo = await stellarKit.loadToken(contractId, stellarAddress);
      return tokenInfo;
    } catch (error) {
      console.error('Error cargando token:', error);
      return null;
    }
  };

  const getTokenBalance = async (contractId: string, address?: string) => {
    if (!stellarKit) {
      console.error('StellarKit no inicializado');
      return null;
    }

    try {
      const addressToCheck = address || stellarAddress;
      const balance = await stellarKit.getTokenBalance(contractId, addressToCheck);
      return balance;
    } catch (error) {
      console.error('Error obteniendo balance del token:', error);
      return null;
    }
  };

  // Nuevo método para enviar pagos
  const sendPayment = async (destination: string, amount: string, asset?: string, memo?: string) => {
    if (!stellarKit || !stellarAccount) {
      console.error('StellarKit no inicializado o usuario no autenticado');
      return null;
    }

    try {
      const result = await stellarKit.sendPayment(
        stellarAccount.secretKey,
        destination,
        amount,
        { memo }
      );
      return result;
    } catch (error) {
      console.error('Error enviando pago:', error);
      return {
        success: false,
        error: 'Error enviando pago: ' + (error instanceof Error ? error.message : String(error))
      };
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
        stellarKit,
        login,
        logout,
        getBalance,
        getPrivateKey,
        // Nuevos métodos
        loadToken,
        getTokenBalance,
        sendPayment,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
};