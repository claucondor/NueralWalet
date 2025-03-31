import React, { useState, useEffect } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFriendVault } from '@/context/FriendVaultContext';
import { useWeb3Auth } from '@/context/Web3AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DepositVaultScreenProps {
  vaultId: string;
  onClose: () => void;
}

const DepositVaultScreen: React.FC<DepositVaultScreenProps> = ({ vaultId, onClose }) => {
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('XLM');
  const [isDepositing, setIsDepositing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { selectedVault, depositToVault, loadVaultDetails } = useFriendVault();
  const { stellarBalance, getBalance } = useWeb3Auth();

  useEffect(() => {
    if (vaultId && !selectedVault) {
      loadVaultDetails(vaultId);
    }
  }, [vaultId, selectedVault, loadVaultDetails]);

  // Función para manejar el cambio de cantidad
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Permitir solo números con punto decimal (hasta 7 decimales para XLM)
    if (/^\d*\.?\d{0,7}$/.test(value) || value === '') {
      setAmount(value);
      setErrorMessage('');
    }
  };

  // Función para manejar el depósito
  const handleDeposit = async () => {
    // Validar la cantidad
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setErrorMessage('Por favor, introduce una cantidad válida');
      return;
    }

    // Validar que la cantidad sea menor o igual al balance disponible
    if (parseFloat(amount) > stellarBalance) {
      setErrorMessage('No tienes suficiente balance para realizar este depósito');
      return;
    }

    // Para XLM, verificar que quede al menos 1 XLM como reserva
    if (tokenAddress === 'XLM' && stellarBalance - parseFloat(amount) < 1) {
      setErrorMessage('Debes mantener al menos 1 XLM en tu cuenta como reserva');
      return;
    }
    
    setIsDepositing(true);
    
    try {
      const success = await depositToVault(vaultId, amount, tokenAddress === 'XLM' ? undefined : tokenAddress);
      
      if (success) {
        // Actualizar el balance
        getBalance();
        onClose();
      }
    } catch (error: any) {
      console.error('Error al depositar:', error);
      setErrorMessage(error.message || 'Ocurrió un error al realizar el depósito');
    } finally {
      setIsDepositing(false);
    }
  };

  // Función para formatear el balance
  const formatBalance = (balance: number) => {
    if (isNaN(balance) || balance === undefined || balance === null) return '0.0000';
    return balance.toFixed(4);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onClose} disabled={isDepositing}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h2 className="text-xl font-semibold">Depositar en el Vault</h2>
        <div className="w-9"></div>
      </div>

      {/* Form */}
      <div className="flex-1 p-4 overflow-y-auto space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Vault: {selectedVault?.name || 'Cargando...'}</h3>
          <p className="text-sm text-gray-600">
            Los fondos depositados serán accesibles para todos los miembros del vault,
            pero para retirarlos se requerirá la aprobación de todos.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="token-select">Token</Label>
          <Select 
            value={tokenAddress} 
            onValueChange={setTokenAddress}
            disabled={isDepositing}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un token" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="XLM">XLM (Stellar Lumens)</SelectItem>
              {/* Aquí se podrían agregar otros tokens soportados */}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="amount-input">Cantidad</Label>
            <span className="text-sm text-gray-500">
              Balance: {formatBalance(stellarBalance)} XLM
            </span>
          </div>
          <Input
            id="amount-input"
            placeholder="0.0"
            value={amount}
            onChange={handleAmountChange}
            disabled={isDepositing}
            type="text"
            inputMode="decimal"
          />
          <div className="flex justify-between text-sm">
            <span className="text-red-500">{errorMessage}</span>
            <button 
              className="text-blue-600"
              onClick={() => setAmount(formatBalance(stellarBalance - 1))}
              disabled={isDepositing || stellarBalance <= 1}
            >
              Máximo
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-1">Importante</h4>
          <ul className="list-disc pl-4 space-y-1">
            <li>Los depósitos son inmediatos y no requieren aprobación</li>
            <li>Los fondos depositados formarán parte del Vault compartido</li>
            <li>Debes mantener al menos 1 XLM en tu cuenta personal como reserva</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button 
          className="w-full"
          onClick={handleDeposit}
          disabled={!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || isDepositing}
        >
          {isDepositing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Depositando...
            </>
          ) : (
            `Depositar ${amount || '0'} ${tokenAddress}`
          )}
        </Button>
      </div>
    </div>
  );
};

export default DepositVaultScreen; 