import { Request, Response } from 'express';
import StellarWalletKit from '../../lib';
import { supabase, checkUserByEmail } from '../../lib/utils/supabase';
import { v4 as uuidv4 } from 'uuid';

// Interfaces para el Friend Vault
export interface FriendVault {
  id: string;
  name: string;
  description: string;
  public_key: string;
  secretKey: string; // Almacenado encriptado
  created_by: string;
  members: string[]; // Emails de los miembros
  created_at: string;
  updated_at: string;
  balance: string;
  tokenBalances?: TokenBalance[];
}

interface TokenBalance {
  tokenAddress: string;
  symbol: string;
  balance: string;
}

export interface WithdrawalRequest {
  id: string;
  vaultId: string;
  amount: string;
  tokenAddress: string; // 'XLM' para el token nativo
  recipient: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  approvals: string[]; // Emails de quienes han aprobado
  rejections: string[]; // Emails de quienes han rechazado
}

// Verifica y valida emails de los miembros
async function validateMembers(memberEmails: string[]): Promise<{ 
  valid: boolean; 
  validMembers: string[]; 
  invalidMembers: string[];
}> {
  const results: { valid: boolean; validMembers: string[]; invalidMembers: string[] } = {
    valid: true,
    validMembers: [],
    invalidMembers: []
  };

  // Verificar cada email
  for (const email of memberEmails) {
    const { exists, error } = await checkUserByEmail(email);
    if (exists) {
      results.validMembers.push(email);
    } else {
      results.invalidMembers.push(email);
      results.valid = false;
    }
  }

  return results;
}

/**
 * Crea un nuevo Friend Vault
 */
export async function createFriendVault(req: Request, res: Response) {
  try {
    const { name, description, creatorEmail, memberEmails } = req.body;

    // Validar datos requeridos
    if (!name || !creatorEmail || !memberEmails || !Array.isArray(memberEmails)) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos',
        message: 'Se requiere nombre, email del creador y lista de miembros'
      });
    }

    // Asegurarse de que el creador esté registrado
    const creatorCheck = await checkUserByEmail(creatorEmail);
    if (!creatorCheck.exists) {
      return res.status(400).json({
        success: false,
        error: 'Usuario no encontrado',
        message: 'El creador no está registrado en el sistema'
      });
    }

    // Validar los miembros
    const uniqueMemberEmails = Array.from(new Set([...memberEmails, creatorEmail]));
    const memberValidation = await validateMembers(uniqueMemberEmails);

    if (!memberValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Miembros inválidos',
        message: 'Algunos miembros no están registrados en el sistema',
        data: {
          invalidMembers: memberValidation.invalidMembers
        }
      });
    }

    // Crear una nueva cuenta de Stellar para el vault
    const newAccount = StellarWalletKit.generateKeypair();
    
    // Dar formato a los datos del vault
    const vaultId = uuidv4();
    const newVault: FriendVault = {
      id: vaultId,
      name,
      description: description || '',
      public_key: newAccount.publicKey,
      secretKey: newAccount.secretKey, // En producción, esto debe cifrarse
      created_by: creatorEmail,
      members: memberValidation.validMembers,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      balance: '0' // Saldo inicial
    };

    // Guardar el vault en Supabase
    const { data, error } = await supabase
      .from('friend_vaults')
      .insert(newVault);

    if (error) {
      console.error('Error al crear Friend Vault en Supabase:', error);
      return res.status(500).json({
        success: false,
        error: 'Error de base de datos',
        message: 'No se pudo crear el Friend Vault'
      });
    }

    // Devolver respuesta exitosa
    return res.status(201).json({
      success: true,
      message: 'Friend Vault creado exitosamente',
      data: {
        vaultId: vaultId,
        name: name,
        public_key: newAccount.publicKey,
        members: memberValidation.validMembers
      }
    });
  } catch (error: any) {
    console.error('Error al crear Friend Vault:', error);
    return res.status(500).json({
      success: false,
      error: 'Error del servidor',
      message: error.message || 'Error inesperado al crear el Friend Vault'
    });
  }
}

/**
 * Obtiene los Friend Vaults asociados a un usuario
 */
export async function getFriendVaultsByUser(req: Request, res: Response) {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos',
        message: 'Se requiere el email del usuario'
      });
    }

    // Verificar que el usuario existe
    const userCheck = await checkUserByEmail(email);
    if (!userCheck.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        message: 'El usuario no está registrado en el sistema'
      });
    }

    // Buscar vaults donde el usuario es miembro
    const { data, error } = await supabase
      .from('friend_vaults')
      .select('id, name, description, public_key, created_by, members, created_at, updated_at, balance')
      .contains('members', [email]);

    if (error) {
      console.error('Error al obtener Friend Vaults de Supabase:', error);
      return res.status(500).json({
        success: false,
        error: 'Error de base de datos',
        message: 'No se pudieron obtener los Friend Vaults'
      });
    }

    // Obtener el balance actual de cada vault
    const vaultsWithBalance = await Promise.all(data.map(async (vault) => {
      try {
        const accountInfo = await StellarWalletKit.getAccountInfo(vault.public_key);
        return {
          ...vault,
          balance: accountInfo ? accountInfo.balance : '0',
          isCreator: vault.created_by === email
        };
      } catch (error) {
        console.error(`Error al obtener balance del vault ${vault.id}:`, error);
        return {
          ...vault,
          balance: '0',
          isCreator: vault.created_by === email
        };
      }
    }));

    return res.status(200).json({
      success: true,
      message: 'Friend Vaults obtenidos exitosamente',
      data: vaultsWithBalance
    });
  } catch (error: any) {
    console.error('Error al obtener Friend Vaults:', error);
    return res.status(500).json({
      success: false,
      error: 'Error del servidor',
      message: error.message || 'Error inesperado al obtener los Friend Vaults'
    });
  }
}

/**
 * Obtiene los detalles de un Friend Vault específico
 */
export async function getFriendVaultDetails(req: Request, res: Response) {
  try {
    const { vaultId } = req.params;
    const { userEmail } = req.query;

    if (!vaultId) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos',
        message: 'Se requiere el ID del vault'
      });
    }

    // Obtener el vault de Supabase
    const { data: vault, error } = await supabase
      .from('friend_vaults')
      .select('*')
      .eq('id', vaultId)
      .single();

    if (error) {
      console.error('Error al obtener Friend Vault de Supabase:', error);
      return res.status(500).json({
        success: false,
        error: 'Error de base de datos',
        message: 'No se pudo obtener el Friend Vault'
      });
    }

    if (!vault) {
      return res.status(404).json({
        success: false,
        error: 'Vault no encontrado',
        message: 'El Friend Vault solicitado no existe'
      });
    }

    // Verificar que el usuario tenga acceso al vault
    if (userEmail && !vault.members.includes(userEmail as string)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado',
        message: 'No tienes permiso para acceder a este Friend Vault'
      });
    }

    // Obtener el balance actual del vault
    try {
      const accountInfo = await StellarWalletKit.getAccountInfo(vault.public_key);
      vault.balance = accountInfo ? accountInfo.balance : '0';
      
      // Obtener balances de tokens personalizados (se implementaría aquí)
      vault.tokenBalances = []; // Placeholder para futura implementación
    } catch (error) {
      console.error(`Error al obtener balance del vault ${vault.id}:`, error);
      vault.balance = '0';
      vault.tokenBalances = [];
    }

    // Obtener solicitudes de retiro pendientes
    const { data: withdrawalRequests, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('vaultId', vaultId)
      .order('requestedAt', { ascending: false });

    if (withdrawalError) {
      console.error('Error al obtener solicitudes de retiro:', withdrawalError);
    }

    // Por seguridad, no enviar la clave privada
    const safeVault = {
      ...vault,
      secretKey: undefined,
      withdrawalRequests: withdrawalRequests || []
    };

    return res.status(200).json({
      success: true,
      message: 'Friend Vault obtenido exitosamente',
      data: safeVault
    });
  } catch (error: any) {
    console.error('Error al obtener detalles del Friend Vault:', error);
    return res.status(500).json({
      success: false,
      error: 'Error del servidor',
      message: error.message || 'Error inesperado al obtener detalles del Friend Vault'
    });
  }
}

/**
 * Deposita fondos en un Friend Vault
 */
export async function depositToFriendVault(req: Request, res: Response) {
  try {
    const { vaultId, amount, tokenAddress, senderPrivateKey, senderEmail } = req.body;

    // Validar datos requeridos
    if (!vaultId || !amount || !senderPrivateKey || !senderEmail) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos',
        message: 'Se requiere ID del vault, cantidad, clave privada del remitente y email del remitente'
      });
    }

    // Obtener información del vault
    const { data: vault, error } = await supabase
      .from('friend_vaults')
      .select('public_key, members')
      .eq('id', vaultId)
      .single();

    if (error || !vault) {
      console.error('Error al obtener Friend Vault:', error);
      return res.status(404).json({
        success: false,
        error: 'Vault no encontrado',
        message: 'El Friend Vault solicitado no existe'
      });
    }

    // Verificar que el remitente sea miembro del vault
    if (!vault.members.includes(senderEmail)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado',
        message: 'No eres miembro de este Friend Vault'
      });
    }

    // Realizar el depósito
    let depositResult;
    
    // Si es token nativo (XLM)
    if (!tokenAddress || tokenAddress === 'XLM') {
      depositResult = await StellarWalletKit.sendPayment(
        senderPrivateKey,
        vault.public_key,
        amount,
        { memo: `Depósito en Friend Vault: ${vaultId}` }
      );
    } 
    // Si es un token Soroban
    else {
      depositResult = await StellarWalletKit.sendToken(
        tokenAddress,
        senderPrivateKey, 
        vault.public_key,
        amount
      );
    }

    if (!depositResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Error en la transacción',
        message: depositResult.error || 'No se pudo realizar el depósito'
      });
    }

    // Registrar la transacción en Supabase
    const transactionRecord = {
      id: uuidv4(),
      vaultId,
      type: 'deposit',
      amount,
      tokenAddress: tokenAddress || 'XLM',
      sender: senderEmail,
      recipient: vault.public_key,
      transactionHash: depositResult.hash,
      timestamp: new Date().toISOString()
    };

    const { error: transactionError } = await supabase
      .from('vault_transactions')
      .insert(transactionRecord);

    if (transactionError) {
      console.error('Error al registrar transacción:', transactionError);
      // No fallamos toda la operación, solo registramos el error
    }

    return res.status(200).json({
      success: true,
      message: 'Depósito realizado exitosamente',
      data: {
        transaction: depositResult.hash,
        amount,
        tokenAddress: tokenAddress || 'XLM'
      }
    });
  } catch (error: any) {
    console.error('Error al realizar depósito en Friend Vault:', error);
    return res.status(500).json({
      success: false,
      error: 'Error del servidor',
      message: error.message || 'Error inesperado al realizar el depósito'
    });
  }
}

/**
 * Solicita un retiro de un Friend Vault
 */
export async function requestWithdrawal(req: Request, res: Response) {
  try {
    const { vaultId, amount, tokenAddress, recipient, requestedBy } = req.body;

    // Validar datos requeridos
    if (!vaultId || !amount || !recipient || !requestedBy) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos',
        message: 'Se requiere ID del vault, cantidad, destinatario y solicitante'
      });
    }

    // Obtener información del vault
    const { data: vault, error } = await supabase
      .from('friend_vaults')
      .select('members, balance, public_key')
      .eq('id', vaultId)
      .single();

    if (error || !vault) {
      console.error('Error al obtener Friend Vault:', error);
      return res.status(404).json({
        success: false,
        error: 'Vault no encontrado',
        message: 'El Friend Vault solicitado no existe'
      });
    }

    // Verificar que el solicitante sea miembro del vault
    if (!vault.members.includes(requestedBy)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado',
        message: 'No eres miembro de este Friend Vault'
      });
    }

    // Verificar saldo disponible
    try {
      const accountInfo = await StellarWalletKit.getAccountInfo(vault.public_key);
      const balance = parseFloat(accountInfo ? accountInfo.balance || '0' : '0');
      const withdrawalAmount = parseFloat(amount);
      
      // Para XLM, verificar que queda al menos 1 XLM como reserva
      if (!tokenAddress || tokenAddress === 'XLM') {
        if (balance - withdrawalAmount < 1) {
          return res.status(400).json({
            success: false,
            error: 'Fondos insuficientes',
            message: 'Debe mantener al menos 1 XLM como reserva en la cuenta'
          });
        }
      }
      // Para otros tokens, implementar verificación aquí
    } catch (error) {
      console.error('Error al verificar saldo:', error);
    }

    // Asegurar que tokenAddress sea un string
    const tokenAddressValue: string = (tokenAddress as string) || 'XLM';

    // Crear solicitud de retiro
    const withdrawalRequest: WithdrawalRequest = {
      id: uuidv4(),
      vaultId,
      amount,
      tokenAddress: tokenAddressValue,
      recipient,
      requestedBy,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      approvals: [requestedBy], // El solicitante lo aprueba automáticamente
      rejections: []
    };

    // Guardar la solicitud en Supabase
    const { data, error: insertError } = await supabase
      .from('withdrawal_requests')
      .insert(withdrawalRequest);

    if (insertError) {
      console.error('Error al crear solicitud de retiro:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Error de base de datos',
        message: 'No se pudo crear la solicitud de retiro'
      });
    }

    // Notificar a los demás miembros (implementación futura)
    // En una versión final, aquí se enviarían emails o notificaciones

    return res.status(201).json({
      success: true,
      message: 'Solicitud de retiro creada exitosamente',
      data: {
        requestId: withdrawalRequest.id,
        vaultId,
        amount,
        tokenAddress: tokenAddressValue,
        recipient,
        status: 'pending',
        requiredApprovals: vault.members.length,
        currentApprovals: 1
      }
    });
  } catch (error: any) {
    console.error('Error al solicitar retiro del Friend Vault:', error);
    return res.status(500).json({
      success: false,
      error: 'Error del servidor',
      message: error.message || 'Error inesperado al solicitar el retiro'
    });
  }
}

/**
 * Vota (aprueba o rechaza) una solicitud de retiro
 */
export async function voteOnWithdrawal(req: Request, res: Response) {
  try {
    const { requestId, voterEmail, vote } = req.body;

    // Validar datos requeridos
    if (!requestId || !voterEmail || (vote !== 'approve' && vote !== 'reject')) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos',
        message: 'Se requiere ID de la solicitud, email del votante y voto (approve/reject)'
      });
    }

    // Obtener la solicitud de retiro
    const { data: request, error } = await supabase
      .from('withdrawal_requests')
      .select('*, friend_vaults!inner(members)')
      .eq('id', requestId)
      .single();

    if (error || !request) {
      console.error('Error al obtener solicitud de retiro:', error);
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada',
        message: 'La solicitud de retiro no existe'
      });
    }

    // Verificar que la solicitud esté pendiente
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Solicitud inválida',
        message: `La solicitud ya fue ${request.status === 'approved' ? 'aprobada' : 
                                        request.status === 'rejected' ? 'rechazada' : 'ejecutada'}`
      });
    }

    // Verificar que el votante sea miembro del vault
    const members = request.friend_vaults.members;
    if (!members.includes(voterEmail)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado',
        message: 'No eres miembro de este Friend Vault'
      });
    }

    // Verificar que el votante no haya votado ya
    if (request.approvals.includes(voterEmail) || request.rejections.includes(voterEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Voto duplicado',
        message: 'Ya has votado en esta solicitud'
      });
    }

    // Actualizar la solicitud según el voto
    let updateData: { approvals?: string[], rejections?: string[], status?: string } = {};
    let newStatus = 'pending';

    if (vote === 'approve') {
      updateData.approvals = [...request.approvals, voterEmail];
      
      // Si todos los miembros han aprobado, cambiar el estado
      if (updateData.approvals.length === members.length) {
        updateData.status = 'approved';
        newStatus = 'approved';
      }
    } else {
      updateData.rejections = [...request.rejections, voterEmail];
      
      // Si algún miembro rechaza, la solicitud se rechaza
      updateData.status = 'rejected';
      newStatus = 'rejected';
    }

    // Actualizar en Supabase
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', requestId);

    if (updateError) {
      console.error('Error al actualizar solicitud de retiro:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Error de base de datos',
        message: 'No se pudo actualizar la solicitud de retiro'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Voto registrado exitosamente. Solicitud ${newStatus === 'pending' ? 'pendiente' : 
                                                         newStatus === 'approved' ? 'aprobada' : 'rechazada'}`,
      data: {
        requestId,
        status: newStatus,
        approvals: vote === 'approve' ? request.approvals.length + 1 : request.approvals.length,
        rejections: vote === 'reject' ? request.rejections.length + 1 : request.rejections.length,
        totalMembers: members.length
      }
    });
  } catch (error: any) {
    console.error('Error al votar solicitud de retiro:', error);
    return res.status(500).json({
      success: false,
      error: 'Error del servidor',
      message: error.message || 'Error inesperado al votar la solicitud'
    });
  }
}

/**
 * Ejecuta un retiro que ha sido aprobado
 */
export async function executeWithdrawal(req: Request, res: Response) {
  try {
    const { requestId, executorEmail } = req.body;

    // Validar datos requeridos
    if (!requestId || !executorEmail) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos',
        message: 'Se requiere ID de la solicitud y email del ejecutor'
      });
    }

    // Obtener la solicitud de retiro con información del vault
    const { data: request, error } = await supabase
      .from('withdrawal_requests')
      .select(`
        *,
        friend_vaults:vaultId (
          public_key,
          secretKey,
          members
        )
      `)
      .eq('id', requestId)
      .single();

    if (error || !request) {
      console.error('Error al obtener solicitud de retiro:', error);
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada',
        message: 'La solicitud de retiro no existe'
      });
    }

    // Verificar que la solicitud esté aprobada
    if (request.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Solicitud inválida',
        message: `La solicitud está en estado ${request.status} y no puede ser ejecutada`
      });
    }

    // Verificar que el ejecutor sea miembro del vault
    if (!request.friend_vaults.members.includes(executorEmail)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado',
        message: 'No eres miembro de este Friend Vault'
      });
    }

    // Ejecutar el retiro
    let withdrawalResult;
    
    // Si es token nativo (XLM)
    if (!request.tokenAddress || request.tokenAddress === 'XLM') {
      withdrawalResult = await StellarWalletKit.sendPayment(
        request.friend_vaults.secretKey,
        request.recipient,
        request.amount,
        { memo: `Retiro de Friend Vault: ${request.vaultId}` }
      );
    } 
    // Si es un token Soroban
    else {
      withdrawalResult = await StellarWalletKit.sendToken(
        request.tokenAddress,
        request.friend_vaults.secretKey,
        request.recipient,
        request.amount
      );
    }

    if (!withdrawalResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Error en la transacción',
        message: withdrawalResult.error || 'No se pudo ejecutar el retiro'
      });
    }

    // Actualizar estado de la solicitud a 'executed'
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({ 
        status: 'executed',
        executedAt: new Date().toISOString(),
        executedBy: executorEmail,
        transactionHash: withdrawalResult.hash
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error al actualizar solicitud de retiro:', updateError);
      // No fallamos toda la operación, solo registramos el error
    }

    // Registrar la transacción en el historial
    const transactionRecord = {
      id: uuidv4(),
      vaultId: request.vaultId,
      type: 'withdrawal',
      amount: request.amount,
      tokenAddress: request.tokenAddress || 'XLM',
      sender: request.friend_vaults.public_key,
      recipient: request.recipient,
      requestId: request.id,
      transactionHash: withdrawalResult.hash,
      timestamp: new Date().toISOString()
    };

    const { error: transactionError } = await supabase
      .from('vault_transactions')
      .insert(transactionRecord);

    if (transactionError) {
      console.error('Error al registrar transacción:', transactionError);
      // No fallamos toda la operación, solo registramos el error
    }

    return res.status(200).json({
      success: true,
      message: 'Retiro ejecutado exitosamente',
      data: {
        requestId,
        transaction: withdrawalResult.hash,
        amount: request.amount,
        tokenAddress: request.tokenAddress || 'XLM',
        recipient: request.recipient
      }
    });
  } catch (error: any) {
    console.error('Error al ejecutar retiro del Friend Vault:', error);
    return res.status(500).json({
      success: false,
      error: 'Error del servidor',
      message: error.message || 'Error inesperado al ejecutar el retiro'
    });
  }
} 