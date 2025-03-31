import React, { useEffect } from "react";
import TokenItem from "./TokenItem";
import { useWeb3Auth } from '@/context/Web3AuthContext';
import { useCustomTokens, CustomToken } from '@/hooks/useCustomTokens';
import { AddTokenDialog } from './AddTokenDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// Icono para XLM (puedes cambiarlo por una versión más adecuada)
const XLM_ICON_URL = 'https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png';

interface Token {
  id: string;
  icon: string;
  name: string;
  price: string;
  priceChange: string;
  amount: string;
  symbol: string;
  value: string;
  isPositive?: boolean;
}

interface TokensListProps {
  tokens: Token[];
}

// Componente TokensList con exportación por defecto
export default function TokensList() {
  const { stellarAccount, stellarBalance, getBalance, getTokenBalance } = useWeb3Auth();
  const { customTokens, addToken, removeToken, updateTokenBalance } = useCustomTokens();

  // Obtener el balance cuando se carga el componente o cambia la cuenta
  useEffect(() => {
    if (stellarAccount) {
      console.log('TokensList: Obteniendo balance de XLM');
      getBalance();
    }
  }, [stellarAccount, getBalance]);

  // Actualizar el balance de XLM cada 60 segundos
  useEffect(() => {
    if (!stellarAccount) return;
    
    const intervalId = setInterval(() => {
      console.log('TokensList: Actualizando balance de XLM (intervalo)');
      getBalance();
    }, 60000); // cada 60 segundos
    
    return () => clearInterval(intervalId);
  }, [stellarAccount, getBalance]);

  // Cargar los balances de los tokens personalizados
  useEffect(() => {
    const loadTokenBalances = async () => {
      if (!stellarAccount) return;

      // Para cada token personalizado, obtener su balance
      for (const token of customTokens) {
        try {
          console.log(`Obteniendo balance para token: ${token.contractId}`);
          
          // Introducir un retraso de 500ms entre cada solicitud para evitar sobrecarga
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Usar el método desde el contexto que ahora utiliza la API
          const balanceResult = await getTokenBalance(token.contractId, stellarAccount.publicKey);
          
          console.log(`Balance obtenido para ${token.symbol}:`, balanceResult);
          
          // Actualizar el balance si se obtuvo correctamente
          if (balanceResult && balanceResult.formattedBalance) {
            updateTokenBalance(token.contractId, balanceResult.formattedBalance);
          } else if (balanceResult && typeof balanceResult === 'object') {
            // Si el resultado es un objeto pero no tiene formattedBalance, intentar usar el balance
            updateTokenBalance(token.contractId, balanceResult.balance || '0');
          } else if (balanceResult && typeof balanceResult === 'string') {
            // Si el resultado es directamente un string
            updateTokenBalance(token.contractId, balanceResult);
          } else {
            // Si no hay un formato específico, asignar 0
            updateTokenBalance(token.contractId, '0');
          }
        } catch (error) {
          console.error(`Error al obtener balance del token ${token.contractId}:`, error);
          updateTokenBalance(token.contractId, '0');
        }
      }
    };

    if (stellarAccount) {
      loadTokenBalances();
    }
  }, [stellarAccount, getTokenBalance, customTokens, updateTokenBalance]);

  // Handler para añadir un nuevo token
  const handleAddToken = (token: CustomToken) => {
    return addToken(token);
  };

  // Handler para remover un token
  const handleRemoveToken = (contractId: string) => {
    removeToken(contractId);
  };

  // Formatear el balance con el número correcto de decimales
  const formatBalance = (balance: string | number, decimals: number) => {
    console.log(`Formateando balance: ${balance}, tipo: ${typeof balance}, decimales: ${decimals}`);
    
    // Si el balance es una cadena, intentar convertirla a número
    let num: number;
    if (typeof balance === 'string') {
      try {
        // Remover cualquier carácter no numérico excepto el punto decimal
        const cleanedString = balance.replace(/[^\d.]/g, '');
        num = parseFloat(cleanedString);
      } catch (e) {
        console.error('Error al parsear balance:', e);
        num = 0;
      }
    } else {
      num = balance as number;
    }
    
    // Verificar si es un número válido
    if (isNaN(num) || num === undefined || num === null) {
      console.warn('Balance inválido, usando 0');
      return '0.' + '0'.repeat(decimals);
    }
    
    // Formatear con la cantidad correcta de decimales
    const formatted = num.toFixed(decimals);
    console.log(`Balance formateado: ${formatted}`);
    return formatted;
  };

  // Verificar si hay balance y mostrar valor predeterminado si no
  const xlmBalance = stellarBalance ? formatBalance(stellarBalance, 7) : '0.0000000';

  // Registrar en consola para debug
  console.log('Stellar Balance:', stellarBalance, 'Formatted:', xlmBalance);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Tus Activos</h2>
        <AddTokenDialog onAddToken={handleAddToken} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={XLM_ICON_URL} alt="XLM" />
              <AvatarFallback>XLM</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>Stellar Lumens</CardTitle>
              <CardDescription>XLM</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">{xlmBalance} XLM</div>
            <Button variant="outline" size="sm" onClick={getBalance}>
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {customTokens.length > 0 && (
        <>
          <Separator className="my-4" />
          <h3 className="text-lg font-semibold mb-2">Tokens Personalizados</h3>
          
          {customTokens.map((token) => (
            <Card key={token.contractId} className="mb-3">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {token.logoUrl ? (
                      <AvatarImage src={token.logoUrl} alt={token.symbol} />
                    ) : null}
                    <AvatarFallback>{token.symbol.slice(0, 3)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{token.name}</CardTitle>
                    <CardDescription>{token.symbol}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBalance(token.balance || '0', token.decimals)} {token.symbol}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  ID: {token.contractId}
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-destructive hover:text-destructive/90" 
                  onClick={() => handleRemoveToken(token.contractId)}
                >
                  Eliminar Token
                </Button>
              </CardFooter>
            </Card>
          ))}
        </>
      )}

      {!stellarAccount && (
        <div className="text-center p-4 bg-muted rounded-lg">
          <p>Conecta tu wallet para ver y administrar tus activos</p>
        </div>
      )}
    </div>
  );
}
