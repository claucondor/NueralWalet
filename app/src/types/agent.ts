/**
 * Tipos relacionados con la configuración del agente
 */

export interface AgentLimits {
  id?: number;
  user_address: string;              // Dirección del usuario dueño de esta configuración
  max_tokens_per_tx: number;         // Cantidad máxima de tokens por transacción
  daily_tx_limit: number;            // Límite diario de transacciones
  max_tx_per_day: number;            // Número máximo de transacciones por día
  monthly_tx_limit: number;          // Límite mensual de transacciones
  whitelist_addresses: string[];     // Lista blanca de direcciones permitidas
  created_at?: string;
  updated_at?: string;
}

export interface AgentTransaction {
  id?: number;
  from_address: string;
  to_address: string;
  amount: number;
  token_type: string;
  tx_hash?: string;
  status: 'pending' | 'success' | 'rejected' | 'error';
  created_at?: string;
}

export const DEFAULT_AGENT_LIMITS: Omit<AgentLimits, 'user_address'> = {
  max_tokens_per_tx: 100,            // 100 tokens máximo por transacción
  daily_tx_limit: 1000,              // 1000 tokens máximo por día
  max_tx_per_day: 5,                 // 5 transacciones máximo por día
  monthly_tx_limit: 10000,           // 10000 tokens máximo por mes
  whitelist_addresses: [],           // Sin direcciones en lista blanca por defecto
}; 