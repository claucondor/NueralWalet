/**
 * Servidor API para StellarKit
 * Este servidor expone las funcionalidades de StellarKit como una API REST
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';

// Importar rutas
import accountRoutes from './routes/account';
import tokenRoutes from './routes/token';
import transactionRoutes from './routes/transaction';
import userRoutes from './routes/user';
import agentRoutes from './routes/agent';

// Cargar variables de entorno
dotenv.config();

// Crear la aplicación Express
const app = express();

// Configurar middlewares
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false // Desactivar CSP para la demo
}));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Configurar rutas API
app.use('/api/account', accountRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/agent', agentRoutes);

// Ruta principal para servir la UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta de estado de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'StellarKit API is running' });
});

// Ruta de estado general (para compatibilidad con el frontend)
app.get('/api/status', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'active', message: 'El servicio está funcionando correctamente' } });
});

// Manejador de errores global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: err.message || 'Algo salió mal'
  });
});

// Puerto predeterminado
const PORT = process.env.PORT || 3000;

// Iniciar el servidor solo si este archivo se ejecuta directamente
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`StellarKit API server listening on port ${PORT}`);
  });
}

export default app;