import React, { useState } from 'react';
import { ChevronLeft, Loader2, UserPlus, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFriendVault } from '@/context/FriendVaultContext';

interface CreateVaultScreenProps {
  onClose: () => void;
}

interface MemberInput {
  address: string;
  name: string;
}

const CreateVaultScreen: React.FC<CreateVaultScreenProps> = ({ onClose }) => {
  const [vaultName, setVaultName] = useState('');
  const [vaultDescription, setVaultDescription] = useState('');
  const [members, setMembers] = useState<MemberInput[]>([{ address: '', name: '' }]);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { createVault } = useFriendVault();

  // Función para manejar el cambio de nombre del vault
  const handleVaultNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVaultName(e.target.value);
    setErrorMessage('');
  };

  // Función para manejar el cambio de descripción del vault
  const handleVaultDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setVaultDescription(e.target.value);
  };

  // Función para manejar el cambio de dirección de un miembro
  const handleMemberAddressChange = (index: number, value: string) => {
    const updatedMembers = [...members];
    updatedMembers[index].address = value;
    setMembers(updatedMembers);
    setErrorMessage('');
  };

  // Función para manejar el cambio de nombre de un miembro
  const handleMemberNameChange = (index: number, value: string) => {
    const updatedMembers = [...members];
    updatedMembers[index].name = value;
    setMembers(updatedMembers);
  };

  // Función para agregar un nuevo miembro
  const handleAddMember = () => {
    setMembers([...members, { address: '', name: '' }]);
  };

  // Función para eliminar un miembro
  const handleRemoveMember = (index: number) => {
    if (members.length > 1) {
      const updatedMembers = [...members];
      updatedMembers.splice(index, 1);
      setMembers(updatedMembers);
    }
  };

  // Función para crear el vault
  const handleCreateVault = async () => {
    // Validar nombre del vault
    if (!vaultName.trim()) {
      setErrorMessage('Please enter a name for the vault');
      return;
    }

    // Validar miembros
    const validMembers = members.filter(m => m.address.trim() !== '');
    if (validMembers.length === 0) {
      setErrorMessage('You must add at least one member to the vault');
      return;
    }

    // Validar direcciones de Stellar
    for (const member of validMembers) {
      if (!member.address.startsWith('G') || member.address.length !== 56) {
        setErrorMessage('Please enter valid Stellar addresses (start with G and have 56 characters)');
        return;
      }
    }

    // Validar que no haya direcciones duplicadas
    const addresses = validMembers.map(m => m.address);
    if (new Set(addresses).size !== addresses.length) {
      setErrorMessage('You cannot add the same address more than once');
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Extraer solo las direcciones para pasarlas a createVault
      const memberAddresses = validMembers.map(m => m.address);

      const success = await createVault(vaultName, vaultDescription, memberAddresses);
      
      if (success) {
        onClose();
      }
    } catch (error: any) {
      console.error('Error al crear vault:', error);
      setErrorMessage(error.message || 'An error occurred while creating the vault');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onClose} disabled={isCreating}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h2 className="text-xl font-semibold">Crear Friend Vault</h2>
        <div className="w-9"></div>
      </div>

      {/* Form */}
      <div className="flex-1 p-4 overflow-y-auto space-y-6">
        <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Los Friend Vaults permiten compartir fondos con amigos y familiares. 
            Todos los miembros deben aprobar las solicitudes de retiro.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vault-name">Nombre del Vault</Label>
            <Input
              id="vault-name"
              placeholder="Ej. Viaje Familiar 2024"
              value={vaultName}
              onChange={handleVaultNameChange}
              disabled={isCreating}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vault-description">Descripción (opcional)</Label>
            <Textarea
              id="vault-description"
              placeholder="Ej. Fondos para nuestro viaje a la playa"
              value={vaultDescription}
              onChange={handleVaultDescriptionChange}
              disabled={isCreating}
              maxLength={200}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Miembros del Vault</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddMember}
              disabled={isCreating}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>

          <div className="space-y-4">
            {members.map((member, index) => (
              <div key={index} className="p-3 border rounded-md space-y-3 bg-gray-50">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Miembro {index + 1}</h4>
                  {members.length > 1 && (
                    <Button
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0" 
                      onClick={() => handleRemoveMember(index)}
                      disabled={isCreating}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`member-address-${index}`}>Dirección de Stellar</Label>
                  <Input
                    id={`member-address-${index}`}
                    placeholder="G..."
                    value={member.address}
                    onChange={(e) => handleMemberAddressChange(index, e.target.value)}
                    disabled={isCreating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`member-name-${index}`}>Nombre (opcional)</Label>
                  <Input
                    id={`member-name-${index}`}
                    placeholder="Ej. Carlos"
                    value={member.name}
                    onChange={(e) => handleMemberNameChange(index, e.target.value)}
                    disabled={isCreating}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="text-sm text-red-500 p-3 bg-red-50 rounded-lg">
            {errorMessage}
          </div>
        )}

        <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-1">Funcionamiento del Friend Vault</h4>
          <ul className="list-disc pl-4 space-y-1">
            <li>Todos los miembros pueden depositar fondos en el vault</li>
            <li>Cualquier miembro puede solicitar un retiro</li>
            <li>Todos los miembros deben aprobar cada solicitud de retiro</li>
            <li>Los fondos solo se liberan cuando todos aprueben</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button 
          className="w-full"
          onClick={handleCreateVault}
          disabled={!vaultName || members.filter(m => m.address.trim()).length === 0 || isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creando Vault...
            </>
          ) : (
            'Crear Friend Vault'
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateVaultScreen;