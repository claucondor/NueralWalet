/**
 * Rutas para operaciones relacionadas con tokens
 */

import express from 'express';
import { 
  getTokenList, 
  getTokenInfo, 
  getTokenBalance, 
  sendToken, 
  mintToken, 
  burnToken 
} from '../handlers/tokenHandlers';

// Crear el router
const router = express.Router();

// Rutas de tokens originales 
router.get('/list', getTokenList as express.RequestHandler);
router.get('/info/:contractId', getTokenInfo as express.RequestHandler);
router.get('/balance/:contractId/:address', getTokenBalance as express.RequestHandler);
router.post('/send', sendToken as express.RequestHandler);
router.post('/mint', mintToken as express.RequestHandler);
router.post('/burn', burnToken as express.RequestHandler);

// Ruta directa para consultar tokens (para facilitar el acceso desde navegador)
// Esta ruta debe ir después de las rutas específicas para evitar conflictos
router.get('/:contractId', getTokenInfo as express.RequestHandler);

export default router;