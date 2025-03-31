import express from 'express';
import * as friendVaultHandlers from '../handlers/friendVaultHandlers';

const router = express.Router();

// Crear un nuevo Friend Vault
router.post('/create', friendVaultHandlers.createFriendVault as unknown as express.RequestHandler);

// Obtener Friend Vaults asociados a un usuario
router.get('/user/:email', friendVaultHandlers.getFriendVaultsByUser as unknown as express.RequestHandler);

// Obtener detalles de un Friend Vault específico
router.get('/:vaultId', friendVaultHandlers.getFriendVaultDetails as unknown as express.RequestHandler);

// Depositar en un Friend Vault
router.post('/deposit', friendVaultHandlers.depositToFriendVault as unknown as express.RequestHandler);

// Solicitar un retiro de un Friend Vault
router.post('/request-withdrawal', friendVaultHandlers.requestWithdrawal as unknown as express.RequestHandler);

// Aprobar o rechazar una solicitud de retiro
router.post('/vote-withdrawal', friendVaultHandlers.voteOnWithdrawal as unknown as express.RequestHandler);

// Ejecutar un retiro aprobado
router.post('/execute-withdrawal', friendVaultHandlers.executeWithdrawal as unknown as express.RequestHandler);

export default router; 