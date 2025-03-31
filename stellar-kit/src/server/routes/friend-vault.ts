import express from 'express';
import * as friendVaultHandlers from '../handlers/friendVaultHandlers';

const router = express.Router();

// Crear un nuevo Friend Vault
router.post('/create', friendVaultHandlers.createFriendVault);

// Obtener Friend Vaults asociados a un usuario
router.get('/user/:email', friendVaultHandlers.getFriendVaultsByUser);

// Obtener detalles de un Friend Vault específico
router.get('/:vaultId', friendVaultHandlers.getFriendVaultDetails);

// Depositar en un Friend Vault
router.post('/deposit', friendVaultHandlers.depositToFriendVault);

// Solicitar un retiro de un Friend Vault
router.post('/request-withdrawal', friendVaultHandlers.requestWithdrawal);

// Aprobar o rechazar una solicitud de retiro
router.post('/vote-withdrawal', friendVaultHandlers.voteOnWithdrawal);

// Ejecutar un retiro aprobado
router.post('/execute-withdrawal', friendVaultHandlers.executeWithdrawal);

export default router; 