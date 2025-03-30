/**
 * Rutas para operaciones relacionadas con cuentas Stellar
 */

import express, { Request, Response } from 'express';
import {
  generateKeypair,
  getAccountInfo,
  fundAccount
} from '../handlers/directHandlers';

// Crear el router
const router = express.Router();

// Rutas de cuenta
router.get('/generate', generateKeypair as express.RequestHandler);
router.get('/:publicKey', getAccountInfo as express.RequestHandler);
router.post('/fund', fundAccount as express.RequestHandler);

export default router; 