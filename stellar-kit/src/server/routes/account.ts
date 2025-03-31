/**
 * Rutas para operaciones relacionadas con cuentas Stellar
 */

import express, { Request, Response } from 'express';
import {
  generateKeypair,
  getAccountInfo,
  fundAccount,
  createAccount,
  evaluateCreditScore
} from '../handlers/accountHandlers';

// Crear el router
const router = express.Router();

// Rutas de cuenta
router.get('/generate', generateKeypair as express.RequestHandler);
router.get('/:publicKey', getAccountInfo as express.RequestHandler);
router.post('/fund', fundAccount as express.RequestHandler);
router.post('/create', createAccount as express.RequestHandler);
router.get('/:publicKey/credit-score', evaluateCreditScore as express.RequestHandler);

export default router; 