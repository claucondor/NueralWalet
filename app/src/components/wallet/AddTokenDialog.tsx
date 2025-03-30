import { useState } from 'react';
import { useWeb3Auth } from '@/context/Web3AuthContext';
import { CustomToken } from '@/hooks/useCustomTokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2 } from 'lucide-react';
import { getTokenInfo } from '@/utils/stellar';

interface AddTokenDialogProps {
  onAddToken: (token: CustomToken) => boolean;
}

export function AddTokenDialog({ onAddToken }: AddTokenDialogProps) {
  const { loadToken } = useWeb3Auth();
  const [contractId, setContractId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [tokenData, setTokenData] = useState<CustomToken | null>(null);

  const loadTokenData = async () => {
    if (!contractId.trim()) {
      setError('Por favor ingresa un ID de contrato válido');
      return;
    }

    setIsLoading(true);
    setError('');
    setTokenData(null);

    try {
      // Validar el formato del ID del contrato
      if (!contractId.match(/^[A-Za-z0-9]{56}$/)) {
        throw new Error('El ID del contrato debe tener 56 caracteres alfanuméricos');
      }

      // Obtener información del token usando la utilidad getTokenInfo
      const tokenInfo = await getTokenInfo(contractId);
      
      if (!tokenInfo) {
        throw new Error('No se pudo obtener información del token. Verifica que sea un contrato válido.');
      }
      
      // Usar la información obtenida para crear el token personalizado
      const newToken: CustomToken = {
        contractId: tokenInfo.contractId,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        balance: '0'
      };
      
      setTokenData(newToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la información del token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToken = () => {
    if (!tokenData) return;
    
    const added = onAddToken(tokenData);
    if (added) {
      setOpen(false);
      setContractId('');
      setTokenData(null);
    } else {
      setError('Este token ya ha sido añadido a tu wallet');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Añadir Token
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Token Personalizado</DialogTitle>
          <DialogDescription>
            Ingresa la dirección del contrato del token para añadirlo a tu wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="contractId">ID del Contrato Token</Label>
            <Input
              id="contractId"
              placeholder="Ej: CAXLNDSFDVCSDFTRSCSDAFGEGATAVDSGFEW5745737FYUHNCMKGDS..."
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
            />
          </div>

          {!tokenData && (
            <Button 
              type="button" 
              disabled={isLoading || !contractId.trim()} 
              onClick={loadTokenData}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buscar Token
            </Button>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {tokenData && (
            <div className="border rounded-lg p-4 mt-2">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-lg">
                  {tokenData.symbol.slice(0, 3)}
                </div>
                <div>
                  <p className="font-medium">{tokenData.name}</p>
                  <p className="text-sm text-muted-foreground">Símbolo: {tokenData.symbol}</p>
                  <p className="text-sm text-muted-foreground">Decimales: {tokenData.decimals}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            disabled={!tokenData} 
            onClick={handleAddToken}
          >
            Añadir Token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 