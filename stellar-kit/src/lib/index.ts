/**
 * Main exports from the Stellar Kit library
 */

// Re-export interfaces
export * from './interfaces';

// Re-export services (incluye StellarWalletKit)
export * from './services';

// Re-export utilities
export * from './utils';

// Re-export las clases de modelo específicas que se necesitan
export { AccountStorage } from './models/AccountStorage';
export { TokenContract } from './models/TokenContract';
export { ContractManager } from './models/ContractManager';

// Exportar una instancia por defecto para uso rápido
import { StellarWalletKit } from './services/StellarWalletKit';
export default new StellarWalletKit(true); // Modo testnet por defecto 