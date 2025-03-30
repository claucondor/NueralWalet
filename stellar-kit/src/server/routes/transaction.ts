/**
 * Rutas para operaciones relacionadas con transacciones Stellar
 */

import express, { Request, Response } from 'express';
import { sendPayment } from '../handlers/directHandlers';

// Crear el router
const router = express.Router();

// Rutas de transacciones
router.post('/payment', sendPayment as express.RequestHandler);

export default router; 