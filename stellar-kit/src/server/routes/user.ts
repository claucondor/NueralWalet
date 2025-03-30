 /**
 * Rutas para operaciones relacionadas con usuarios
 */

import express from 'express';
import { checkEmail, getStatus } from '../handlers/userHandlers';

// Crear el router
const router = express.Router();

// Rutas de usuario
router.get('/check-email/:email', checkEmail as express.RequestHandler);
router.get('/status', getStatus as express.RequestHandler);

export default router;