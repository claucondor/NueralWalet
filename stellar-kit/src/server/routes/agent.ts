/**
 * Rutas para operaciones relacionadas con el agente
 */

import express from 'express';
import { processMessage, getAgentStatus } from '../handlers/agentHandlers';

// Crear el router
const router = express.Router();

// Rutas del agente
router.post('/process-message', processMessage as express.RequestHandler);
router.get('/status', getAgentStatus as express.RequestHandler);

export default router;