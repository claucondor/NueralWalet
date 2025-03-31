import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { clientId, privateKeyProvider, web3AuthNetwork, chainConfig } from '../config/web3auth';
import { CHAIN_NAMESPACES } from '@web3auth/base';
import * as StellarSdk from '@stellar/stellar-sdk';
import { getStellarAccount } from '@/utils/stellar';
import { saveUserWithKey } from '@/utils/supabase';
import { 
  accountService, 
  tokenService, 
  transactionService,
  type TokenInfo,
  type TokenBalance,
  type TransactionResult,
  type CreditScoreResult
} from '@/services/stellarKitApi';

// Definir la interfaz KeyPair localmente
interface KeyPair {
  publicKey: string;
  secretKey: string;
}

// Interfaz para UserInfo
interface UserInfo {
  name: string;
  email: string;
  profileImage: string;
  verifier: string;
  verifierId: string;
}

// Extender la interfaz para incluir los métodos de la API
interface Web3AuthContextType {
  web3auth: Web3Auth | null;
  isInitialized: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  stellarAccount: KeyPair | null;
  stellarAddress: string;
  stellarBalance: number;
  userInfo: UserInfo | null;
  initError: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getBalance: () => Promise<void>;
  getPrivateKey: () => Promise<string | null>;
  // Métodos para interactuar con la API de StellarKit
  loadToken: (contractId: string) => Promise<TokenInfo | null>;
  getTokenBalance: (contractId: string, address?: string) => Promise<TokenBalance | null>;
  sendPayment: (destination: string, amount: string, memo?: string) => Promise<TransactionResult | null>;
  getCreditScore: (language?: string) => Promise<CreditScoreResult>;
}

const Web3AuthContext = createContext<Web3AuthContextType>({} as Web3AuthContextType);

export const useWeb3Auth = () => useContext(Web3AuthContext);

/**
 * Función para generar una cuenta Stellar a partir de una clave privada
 */
export const getAccountFromPrivateKey = (privateKey: string) => {
  return getStellarAccount(privateKey);
};

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
  // Estado para controlar los errores de inicialización
  const [initError, setInitError] = useState<string | null>(null);
  

  const getBalance = async () => {
    if (!stellarAddress) {
      console.log('No se puede obtener balance, falta dirección Stellar');
      return;
    }
    
    console.log('Obteniendo balance para dirección:', stellarAddress);
    
    try {
      // Usar el servicio API para obtener la información de la cuenta
      const accountInfo = await accountService.getAccountInfo(stellarAddress);
      console.log('Respuesta de getAccountInfo:', accountInfo);
      
      if (accountInfo && accountInfo.balance) {
        const balance = parseFloat(accountInfo.balance);
        console.log('Balance obtenido:', balance);
        setStellarBalance(balance);
      } else {
        console.log('No se encontró información de balance en la respuesta');
        // Establecer balance en 0 si no hay información
        setStellarBalance(0);
      }
    } catch (error) {
      console.error('Error getting balance:', error);
      // En caso de error, establecer balance en 0
      setStellarBalance(0);
    }
  };

  const getUserInfo = useCallback(async (web3authInstance: Web3Auth) => {
    if (!web3authInstance.provider) return;

    try {
      const privateKey = await web3authInstance.provider.request({
        method: 'private_key',
      }) as string;

      // Generar cuenta Stellar a partir de la clave EVM
      const { stellarAccount: account, stellarAddress: accountAddress } = getAccountFromPrivateKey(privateKey);
      
      setStellarAccount(account);
      setStellarAddress(accountAddress);

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
        if (accountAddress) {
          try {
            // Usar correo si está disponible, o generar uno basado en la dirección si no
            const email = userEmail || `${accountAddress.substring(0, 8)}@wallet.local`;
            
            // Guardar ambas claves (EVM y Stellar)
            // Guardar solo la segunda mitad de la clave Stellar como medida de seguridad (28 caracteres)
            const stellarKeyHalf = account.secretKey.substring(28);
            const success = await saveUserWithKey(
              email,
              accountAddress,
              {
                evmKeyHalf: privateKey,
                stellarKeyHalf: stellarKeyHalf
              }
            );
            
            if (!success) {
              console.error('Error al guardar las claves en Supabase');
            } else {
              console.log('Claves guardadas con éxito');
              
              // Crear cuenta en Stellar si es necesario (financiación inicial)
              try {
                // Usar la API para verificar si la cuenta existe y obtener balance
                const accountInfo = await accountService.getAccountInfo(accountAddress);
                
                // Si no existe la cuenta, solicitamos fondos del faucet
                if (!accountInfo) {
                  console.log('Cuenta Stellar nueva, solicitando fondos del faucet...');
                  // Usar API para fondear la cuenta
                  const fundResult = await accountService.fundAccount(accountAddress);
                  
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
        
        // Aunque no se pueda obtener la información del usuario de Web3Auth, 
        // guardar la cuenta en Supabase usando la dirección como identificador
        if (accountAddress) {
          try {
            // Guardar solo la segunda mitad de la clave Stellar como medida de seguridad (28 caracteres)
            const stellarKeyHalf = account.secretKey.substring(28);
            const success = await saveUserWithKey(
              `${accountAddress.substring(0, 8)}@wallet.local`,
              accountAddress,
              {
                evmKeyHalf: privateKey,
                stellarKeyHalf: stellarKeyHalf
              }
            );
            
            if (!success) {
              console.error('Error guardando datos de usuario anónimo en Supabase');
            }
          } catch (err) {
            console.error('Error guardando datos de usuario anónimo:', err);
          }
        }
        
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
  }, [getBalance]);

  // Estado para controlar los reintentos de inicialización
  const [initAttempts, setInitAttempts] = useState(0);
  const MAX_INIT_ATTEMPTS = 5; // Aumentado el máximo número de intentos
  
  // Estado para controlar si ya se ha inicializado Web3Auth (caché)
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Estado para controlar si hay una inicialización en curso
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Efecto para inicializar Web3Auth
  useEffect(() => {
    // Si ya se ha intentado el máximo número de veces, no intentar de nuevo
    if (initAttempts >= MAX_INIT_ATTEMPTS && initError) {
      console.warn(`Se alcanzó el límite de ${MAX_INIT_ATTEMPTS} intentos de inicialización. No se intentará de nuevo.`);
      return;
    }
    
    // Si ya se ha inicializado correctamente, no intentar de nuevo
    if (hasInitialized && isInitialized && !initError) {
      console.log('Web3Auth ya se ha inicializado correctamente, no se intentará de nuevo.');
      return;
    }
    
    // Si hay una inicialización en curso, no iniciar otra
    if (isInitializing) {
      console.log('Ya hay una inicialización de Web3Auth en curso, esperando...');
      return;
    }

    // Bandera para controlar si el componente está montado
    let isMounted = true;

    // Función para calcular el tiempo de espera con backoff exponencial
    const getBackoffTime = (attempt: number) => {
      // Aumentar significativamente el tiempo de espera para evitar problemas de rate limit
      // Backoff mucho más agresivo: 5s, 25s, 125s, etc. (base 5 en lugar de 3)
      return Math.min(5000 * Math.pow(5, attempt), 300000); // Entre 5s y 5min
    };

    // Temporizador para el retraso
    let initTimer: NodeJS.Timeout | null = null;

    const init = async () => {
      // Evitar inicialización si el componente ya no está montado
      if (!isMounted) return;
      
      // Marcar que hay una inicialización en curso
      setIsInitializing(true);

      try {
        setInitError(null);
        
        // Usar siempre la red especificada en la configuración
        const network = web3AuthNetwork;
        
        console.log(`Inicializando Web3Auth (intento ${initAttempts + 1}/${MAX_INIT_ATTEMPTS})...`);

        // Verificar si ya existe una instancia de Web3Auth
        if (web3auth) {
          console.log('Usando instancia existente de Web3Auth');
        } else {
          // Crear nueva instancia solo si no existe
          console.log('Creando nueva instancia de Web3Auth');
          // Usar la configuración de chainConfig importada desde web3auth.ts
          // Web3Auth solo soporta redes EVM, usamos esta configuración para obtener la clave privada
          // que luego se usará para derivar la cuenta Stellar
          const web3authInstance = new Web3Auth({
            clientId, 
            web3AuthNetwork: network as any,
            privateKeyProvider
          });
          
          // Verificar si el componente sigue montado antes de actualizar estado
          if (!isMounted) return;

          setWeb3auth(web3authInstance);
          
          // Inicializar modal solo una vez por sesión
          console.log('Inicializando modal de Web3Auth...');
          await web3authInstance.initModal();
          console.log('Modal de Web3Auth inicializado correctamente');
        }
        
        // Verificar si el componente sigue montado antes de actualizar estado
        if (!isMounted) return;

        setIsInitialized(true);
        setHasInitialized(true); // Marcar que se ha inicializado correctamente

        if (web3auth && web3auth.connected) {
          setIsLoggedIn(true);
          await getUserInfo(web3auth);
        }

        // Reiniciar contador de intentos si todo sale bien
        setInitAttempts(0);
      } catch (error: any) {
        // Verificar si el componente sigue montado antes de actualizar estado
        if (!isMounted) return;

        const errorMessage = error?.message || String(error);
        console.error(`Error initializing Web3Auth (intento ${initAttempts + 1}/${MAX_INIT_ATTEMPTS}):`, errorMessage);
        
        // Incrementar contador de intentos
        setInitAttempts(prev => prev + 1);
        
        // Guardar el error para controlar los reintentos
        setInitError(errorMessage);
        
        // Si es un error de recursos, mostrar mensaje más claro y esperar más tiempo
        if (errorMessage.includes('INSUFFICIENT_RESOURCES') || errorMessage.includes('Failed to fetch')) {
          console.warn('Web3Auth está experimentando problemas de recursos, la autenticación puede no estar disponible');
          
          // Solo reintentar automáticamente si no hemos alcanzado el límite
          if (initAttempts < MAX_INIT_ATTEMPTS - 1) {
            // Usar un backoff mucho más agresivo para errores de recursos
            const backoffTime = getBackoffTime(initAttempts); 
            console.log(`Reintentando inicialización en ${backoffTime/1000} segundos...`);
            
            // Programar reintento con backoff exponencial
            initTimer = setTimeout(() => {
              if (isMounted) {
                console.log('Reintentando inicialización de Web3Auth...');
                setIsInitializing(false); // Resetear bandera antes de reintentar
                init();
              }
            }, backoffTime);
          } else {
            // Si alcanzamos el límite de intentos, liberar el bloqueo
            setIsInitializing(false);
          }
        } else {
          // Para otros errores, liberar el bloqueo inmediatamente
          setIsInitializing(false);
        }
        
        // Establecer el estado como inicializado pero con error
        // Esto evita que la UI quede en estado de carga infinita
        setIsInitialized(true);
      }
    };

    // Iniciar el proceso solo una vez al montar el componente
    init();

    // Limpiar temporizador si el componente se desmonta
    return () => {
      isMounted = false;
      if (initTimer) {
        clearTimeout(initTimer);
      }
      // Asegurarse de liberar el bloqueo si el componente se desmonta
      setIsInitializing(false);
    };
  }, [getUserInfo, web3auth, hasInitialized, isInitialized, initError, isInitializing, initAttempts]); // Dependencias actualizadas

  const login = async () => {
    if (!web3auth) {
      console.error('Web3Auth not initialized');
      return;
    }

    // Evitar múltiples intentos de login simultáneos
    if (isLoading) {
      console.log('Ya hay un proceso de login en curso');
      return;
    }

    setIsLoading(true);
    try {
      // Implementar un sistema de reintentos con backoff para el login
      let loginAttempts = 0;
      const MAX_LOGIN_ATTEMPTS = 3;
      
      while (loginAttempts < MAX_LOGIN_ATTEMPTS) {
        try {
          console.log(`Intentando login (intento ${loginAttempts + 1}/${MAX_LOGIN_ATTEMPTS})`);
          await web3auth.connect();
          setIsLoggedIn(true);
          await getUserInfo(web3auth);
          console.log('Login exitoso');
          break; // Salir del bucle si el login es exitoso
        } catch (error: any) {
          loginAttempts++;
          
          // Si es el último intento, propagar el error
          if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
            throw error;
          }
          
          // Si es un error de rate limit, esperar más tiempo
          const errorMessage = error?.message || String(error);
          if (errorMessage.includes('INSUFFICIENT_RESOURCES') || errorMessage.includes('Failed to fetch')) {
            const backoffTime = 5000 * Math.pow(3, loginAttempts);
            console.log(`Error de recursos en login, esperando ${backoffTime/1000} segundos antes de reintentar...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          } else {
            // Para otros errores, esperar menos tiempo
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
    } catch (error) {
      console.error('Error logging in after multiple attempts:', error);
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

  // Métodos para trabajar con tokens usando la API de StellarKit
  const loadToken = async (contractId: string) => {
    if (!stellarAccount) {
      console.error('Usuario no autenticado');
      return null;
    }

    try {
      const tokenInfo = await tokenService.getTokenInfo(contractId, stellarAddress);
      return tokenInfo;
    } catch (error) {
      console.error('Error cargando token:', error);
      return null;
    }
  };

  const getTokenBalance = async (contractId: string, address?: string) => {
    try {
      const addressToCheck = address || stellarAddress;
      
      // Primero intentar cargar la información del token
      const tokenInfo = await loadToken(contractId);
      
      if (!tokenInfo) {
        console.warn(`No se pudo cargar el token ${contractId}. Intentando obtener el balance de todas formas.`);
      }
      
      // Ahora obtener el balance
      const balance = await tokenService.getTokenBalance(contractId, addressToCheck);
      return balance;
    } catch (error) {
      console.error('Error obteniendo balance del token:', error);
      return null;
    }
  };

  // Método para enviar pagos
  const sendPayment = async (destination: string, amount: string, memo?: string) => {
    if (!stellarAccount) {
      console.error('Usuario no autenticado');
      return null;
    }

    try {
      const result = await transactionService.sendPayment(
        stellarAccount.secretKey,
        destination,
        amount,
        memo
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

  const getCreditScore = async (language: string = 'en'): Promise<CreditScoreResult> => {
    try {
      if (!stellarAddress) {
        console.error('No address available to get credit score');
        return { success: false, error: 'No wallet address available' };
      }
      
      console.log(`[DEBUG] Requesting credit score for ${stellarAddress}`);
      const result = await accountService.getCreditScore(stellarAddress, language);
      console.log(`📊 [DEBUG] Credit score API response:`, result);
      
      // Add detailed logging to understand the structure
      if (result && result.success && result.data) {
        console.log(`📊 [DEBUG] Transaction count:`, result.data.analysis?.transactionCount);
        console.log(`📊 [DEBUG] Credit score:`, result.data.creditScore?.score);
      }
      
      return result;
    } catch (error) {
      console.error('Error getting credit score:', error);
      return { success: false, error: String(error) };
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
        initError,
        login,
        logout,
        getBalance,
        getPrivateKey,
        // Métodos para API de StellarKit
        loadToken,
        getTokenBalance,
        sendPayment,
        getCreditScore
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
};