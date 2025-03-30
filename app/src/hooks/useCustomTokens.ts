import { useState, useEffect } from 'react';

export interface CustomToken {
  contractId: string;
  name: string;
  symbol: string;
  decimals: number;
  balance?: string;
  logoUrl?: string;
}

export function useCustomTokens() {
  const [customTokens, setCustomTokens] = useState<CustomToken[]>([]);
  const storageKey = 'guard-wallet-custom-tokens';

  // Cargar tokens desde localStorage al inicializar
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          setCustomTokens(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error al cargar tokens personalizados:', error);
      }
    };

    loadFromStorage();
  }, []);

  // Guardar tokens en localStorage cuando cambian
  useEffect(() => {
    if (customTokens.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(customTokens));
    }
  }, [customTokens]);

  // Añadir un nuevo token
  const addToken = (token: CustomToken) => {
    // Verificar si ya existe un token con este contractId
    const tokenExists = customTokens.some(t => t.contractId === token.contractId);
    
    if (!tokenExists) {
      setCustomTokens(prev => [...prev, token]);
      return true;
    }
    return false;
  };

  // Remover un token
  const removeToken = (contractId: string) => {
    setCustomTokens(prev => prev.filter(token => token.contractId !== contractId));
  };

  // Actualizar el balance de un token
  const updateTokenBalance = (contractId: string, balance: string) => {
    setCustomTokens(prev => 
      prev.map(token => 
        token.contractId === contractId ? { ...token, balance } : token
      )
    );
  };

  return {
    customTokens,
    addToken,
    removeToken,
    updateTokenBalance
  };
} 