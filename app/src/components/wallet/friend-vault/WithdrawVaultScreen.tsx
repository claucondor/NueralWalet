import React, { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFriendVault } from '@/context/FriendVaultContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface WithdrawVaultScreenProps {
  vaultId: string;
  onClose: () => void;
}

const WithdrawVaultScreen: React.FC<WithdrawVaultScreenProps> = ({ vaultId, onClose }) => {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [tokenAddress, setTokenAddress] = useState('XLM');
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { selectedVault, requestWithdrawal, loadVaultDetails } = useFriendVault();

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

  // Función para manejar el cambio de destinatario
  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
    setErrorMessage('');
  };

  // Función para manejar la solicitud de retiro
  const handleRequestWithdrawal = async () => {
    // Validar la cantidad
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setErrorMessage('Por favor, introduce una cantidad válida');
      return;
    }

    // Validar el destinatario (dirección de Stellar)
    if (!recipient || !recipient.startsWith('G') || recipient.length !== 56) {
      setErrorMessage('Por favor, introduce una dirección de Stellar válida');
      return;
    }

    // Validar que haya suficiente balance en el vault
    if (selectedVault && parseFloat(amount) > parseFloat(selectedVault.balance)) {
      setErrorMessage('El vault no tiene suficiente balance para este retiro');
      return;
    }

    // Para XLM, verificar que quede al menos 1 XLM como reserva en el vault
    if (tokenAddress === 'XLM' && selectedVault && parseFloat(selectedVault.balance) - parseFloat(amount) < 1) {
      setErrorMessage('El vault debe mantener al menos 1 XLM como reserva');
      return;
    }
    
    setIsRequesting(true);
    
    try {
      const success = await requestWithdrawal(vaultId, amount, recipient, tokenAddress === 'XLM' ? undefined : tokenAddress);
      
      if (success) {
        onClose();
      }
    } catch (error: any) {
      console.error('Error al solicitar retiro:', error);
      setErrorMessage(error.message || 'Ocurrió un error al solicitar el retiro');
    } finally {
      setIsRequesting(false);
    }
  };

  // Función para formatear el balance
  const formatBalance = (balance?: string) => {
    if (!balance || isNaN(parseFloat(balance))) return '0.0000';
    return parseFloat(balance).toFixed(4);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onClose} disabled={isRequesting}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h2 className="text-xl font-semibold">Solicitar Retiro</h2>
        <div className="w-9"></div>
      </div>

      {/* Form */}
      <div className="flex-1 p-4 overflow-y-auto space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            Los retiros requieren la aprobación de todos los miembros del vault.
            Sólo se ejecutarán cuando todos hayan aprobado la solicitud.
          </AlertDescription>
        </Alert>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Vault: {selectedVault?.name || 'Cargando...'}</h3>
          <div className="text-sm text-gray-600">
            <div>Balance disponible: {formatBalance(selectedVault?.balance)} XLM</div>
            <div>Miembros: {selectedVault?.members.length || 0}</div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="token-select">Token</Label>
          <Select 
            value={tokenAddress} 
            onValueChange={setTokenAddress}
            disabled={isRequesting}
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
              Disponible: {formatBalance(selectedVault?.balance)} XLM
            </span>
          </div>
          <Input
            id="amount-input"
            placeholder="0.0"
            value={amount}
            onChange={handleAmountChange}
            disabled={isRequesting}
            type="text"
            inputMode="decimal"
          />
          <div className="flex justify-end">
            <button 
              className="text-sm text-blue-600"
              onClick={() => {
                if (selectedVault) {
                  // Calcular el máximo que se puede retirar (dejando 1 XLM de reserva)
                  const max = Math.max(0, parseFloat(selectedVault.balance) - 1);
                  setAmount(max.toFixed(4));
                }
              }}
              disabled={isRequesting || !selectedVault || parseFloat(selectedVault.balance) <= 1}
            >
              Máximo
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient-input">Dirección del destinatario</Label>
          <Input
            id="recipient-input"
            placeholder="G..."
            value={recipient}
            onChange={handleRecipientChange}
            disabled={isRequesting}
          />
          <div className="text-xs text-gray-500">
            Introduce una dirección de Stellar válida (comienza con G y tiene 56 caracteres).
          </div>
        </div>

        {errorMessage && (
          <div className="text-sm text-red-500 p-3 bg-red-50 rounded-lg">
            {errorMessage}
          </div>
        )}

        <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-1">Proceso de aprobación</h4>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Tu solicitud será visible para todos los miembros</li>
            <li>Cada miembro debe aprobar la solicitud individualmente</li>
            <li>El retiro solo se ejecutará cuando todos hayan aprobado</li>
            <li>Si algún miembro rechaza la solicitud, esta será cancelada</li>
          </ol>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button 
          className="w-full"
          onClick={handleRequestWithdrawal}
          disabled={
            !amount || 
            isNaN(parseFloat(amount)) || 
            parseFloat(amount) <= 0 || 
            !recipient || 
            isRequesting
          }
        >
          {isRequesting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Solicitando...
            </>
          ) : (
            `Solicitar retiro de ${amount || '0'} ${tokenAddress}`
          )}
        </Button>
      </div>
    </div>
  );
};

export default WithdrawVaultScreen; 