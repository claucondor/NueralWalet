import React, { useEffect, useState } from 'react';
import { ChevronLeft, RefreshCw, ArrowDownToLine, ArrowUpFromLine, Users, UserCircle, Clock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFriendVault } from '@/context/FriendVaultContext';
import { useWeb3Auth } from '@/context/Web3AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WithdrawalRequest } from '@/services/friendVaultService';
import { Separator } from '@/components/ui/separator';

interface VaultDetailsScreenProps {
  vaultId: string;
  onClose: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
}

const VaultDetailsScreen: React.FC<VaultDetailsScreenProps> = ({ 
  vaultId, 
  onClose, 
  onDeposit, 
  onWithdraw 
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const { selectedVault, withdrawalRequests, loadVaultDetails, loading, voteOnWithdrawal, executeWithdrawal } = useFriendVault();
  const { userInfo } = useWeb3Auth();
  const [votingRequestId, setVotingRequestId] = useState<string | null>(null);
  const [executingRequestId, setExecutingRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (vaultId) {
      loadVaultDetails(vaultId);
    }
  }, [vaultId, loadVaultDetails]);

  if (!selectedVault) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden bg-white">
        <div className="flex justify-between items-center p-4 border-b">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h2 className="text-xl font-semibold">Detalles del Vault</h2>
          <div className="w-9"></div>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Función para formatear balance
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  // Función para votar en una solicitud
  const handleVote = async (requestId: string, vote: 'approve' | 'reject') => {
    setVotingRequestId(requestId);
    try {
      await voteOnWithdrawal(requestId, vote);
    } finally {
      setVotingRequestId(null);
    }
  };

  // Función para ejecutar un retiro aprobado
  const handleExecuteWithdrawal = async (requestId: string) => {
    setExecutingRequestId(requestId);
    try {
      await executeWithdrawal(requestId);
    } finally {
      setExecutingRequestId(null);
    }
  };

  // Verificar si el usuario actual ya ha votado
  const hasVoted = (request: WithdrawalRequest) => {
    if (!userInfo?.email) return false;
    return (
      request.approvals.includes(userInfo.email) || 
      request.rejections.includes(userInfo.email)
    );
  };

  // Verificar si una solicitud puede ser ejecutada
  const canExecute = (request: WithdrawalRequest) => {
    if (!selectedVault) return false;
    return (
      request.status === 'approved' && 
      request.approvals.length === selectedVault.members.length
    );
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h2 className="text-xl font-semibold truncate max-w-[200px]">{selectedVault.name}</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => loadVaultDetails(vaultId)}
          disabled={loading}
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Balance y acciones rápidas */}
      <div className="flex flex-col items-center p-4 border-b">
        <div className="text-gray-500 mb-1">Balance total</div>
        <div className="text-2xl font-bold mb-1">{formatBalance(selectedVault.balance)} XLM</div>
        <div className="text-sm text-gray-500 mb-4">
          ~${(parseFloat(formatBalance(selectedVault.balance)) * 0.11).toFixed(2)} USD
        </div>
        
        <div className="flex gap-3 w-full">
          <Button 
            variant="outline" 
            className="flex-1 h-12" 
            onClick={onDeposit}
          >
            <ArrowDownToLine className="h-5 w-5 mr-2" />
            Depositar
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 h-12" 
            onClick={onWithdraw}
          >
            <ArrowUpFromLine className="h-5 w-5 mr-2" />
            Solicitar Retiro
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 mx-4 mt-2">
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="requests">
            Solicitudes
            {withdrawalRequests.filter(req => req.status === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {withdrawalRequests.filter(req => req.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="flex-1 p-4 overflow-y-auto">
          <Card className="p-4 mb-4">
            <h3 className="font-semibold mb-2">Información</h3>
            {selectedVault.description && (
              <p className="text-gray-600 text-sm mb-3">{selectedVault.description}</p>
            )}
            <div className="text-sm mb-1">
              <span className="text-gray-500">Creado por: </span>
              <span className="font-medium">{selectedVault.createdBy}</span>
            </div>
            <div className="text-sm mb-1">
              <span className="text-gray-500">Fecha de creación: </span>
              <span className="font-medium">{formatDate(selectedVault.createdAt)}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Dirección: </span>
              <span className="font-medium break-all">{selectedVault.publicKey}</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Miembros</h3>
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-xs">
                <Users className="h-3 w-3" />
                <span>{selectedVault.members.length}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {selectedVault.members.map((member, index) => (
                <div key={member} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-6 w-6 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{member}</div>
                      {member === selectedVault.createdBy && (
                        <Badge variant="secondary" className="text-xs">Creador</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="requests" className="flex-1 p-4 overflow-y-auto">
          {withdrawalRequests.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Clock className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay solicitudes de retiro</h3>
              <p className="text-gray-500">
                Cuando un miembro solicite un retiro, aparecerá aquí para que puedas aprobarla o rechazarla.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawalRequests
                .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
                .map((request) => (
                  <Card key={request.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">Retiro de {formatBalance(request.amount)} XLM</h4>
                        <div className="text-xs text-gray-500">
                          Solicitado por {request.requestedBy} el {formatDate(request.requestedAt)}
                        </div>
                      </div>
                      <Badge
                        variant={
                          request.status === 'approved' ? 'secondary' :
                          request.status === 'rejected' ? 'destructive' :
                          request.status === 'executed' ? 'secondary' : 'default'
                        }
                      >
                        {request.status === 'pending' ? 'Pendiente' :
                         request.status === 'approved' ? 'Aprobado' :
                         request.status === 'rejected' ? 'Rechazado' : 'Ejecutado'}
                      </Badge>
                    </div>
                    
                    <div className="text-sm mb-3">
                      <div><span className="text-gray-500">Destinatario: </span>{request.recipient}</div>
                      <div><span className="text-gray-500">Token: </span>{request.tokenAddress}</div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Aprobaciones:</span>
                        <span>{request.approvals.length} de {selectedVault.members.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {request.approvals.map(email => (
                          <Badge key={email} variant="outline" className="text-xs bg-green-50">
                            <Check className="h-3 w-3 text-green-500 mr-1" />
                            {email}
                          </Badge>
                        ))}
                      </div>
                      
                      {request.rejections.length > 0 && (
                        <>
                          <div className="text-sm mb-1">Rechazos:</div>
                          <div className="flex flex-wrap gap-1">
                            {request.rejections.map(email => (
                              <Badge key={email} variant="outline" className="text-xs bg-red-50">
                                <X className="h-3 w-3 text-red-500 mr-1" />
                                {email}
                              </Badge>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {request.status === 'pending' && !hasVoted(request) && (
                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleVote(request.id, 'reject')}
                          disabled={votingRequestId === request.id}
                        >
                          <X className="h-4 w-4 mr-1 text-red-500" />
                          Rechazar
                        </Button>
                        <Button 
                          className="flex-1"
                          onClick={() => handleVote(request.id, 'approve')}
                          disabled={votingRequestId === request.id}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                      </div>
                    )}
                    
                    {request.status === 'approved' && canExecute(request) && (
                      <Button 
                        className="w-full mt-3"
                        onClick={() => handleExecuteWithdrawal(request.id)}
                        disabled={executingRequestId === request.id}
                      >
                        {executingRequestId === request.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Ejecutando...
                          </>
                        ) : (
                          <>
                            <ArrowUpFromLine className="h-4 w-4 mr-2" />
                            Ejecutar Retiro
                          </>
                        )}
                      </Button>
                    )}
                    
                    {request.status === 'executed' && request.transactionHash && (
                      <div className="text-xs text-gray-500 mt-3">
                        <span className="font-medium">Transaction hash: </span>
                        <span className="break-all">{request.transactionHash}</span>
                      </div>
                    )}
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VaultDetailsScreen; 