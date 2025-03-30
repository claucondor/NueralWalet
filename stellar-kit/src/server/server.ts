/**
 * Punto de entrada principal para ejecutar el servidor API de StellarKit
 */

import app from './index';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde el archivo .env en la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Puerto predeterminado
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`StellarKit API server running in ${NODE_ENV} mode on port ${PORT}`);
}); 