/**
 * Main exports from the Stellar Kit library
 */

// Re-export interfaces
export * from './interfaces';

// Re-export models
export * from './models';

// Re-export services
export * from './services';

// Re-export utilities
export * from './utils';

// Exportar una instancia por defecto para uso rápido
import { StellarWalletKit } from './models';
export default new StellarWalletKit(true); // Modo testnet por defecto 