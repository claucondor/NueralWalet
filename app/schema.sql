-- Esquema para la base de datos del proyecto wallet-ui con Move Agent Kit

-- Tabla para usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  address VARCHAR(255) NOT NULL UNIQUE,
  private_key_half TEXT,
  stellar_key_half TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para la tabla users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_address ON users(address);

-- Tabla para límites del agente
CREATE TABLE IF NOT EXISTS agent_limits (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(255) NOT NULL UNIQUE,
  max_tokens_per_tx NUMERIC NOT NULL DEFAULT 100,
  daily_tx_limit NUMERIC NOT NULL DEFAULT 1000,
  max_tx_per_day INTEGER NOT NULL DEFAULT 5,
  monthly_tx_limit NUMERIC NOT NULL DEFAULT 10000,
  whitelist_addresses TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_address) REFERENCES users(address) ON DELETE CASCADE
);

-- Índice para la tabla agent_limits
CREATE INDEX IF NOT EXISTS idx_agent_limits_user_address ON agent_limits(user_address);

-- Tabla para el registro de transacciones
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  from_address VARCHAR(255) NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  amount NUMERIC NOT NULL,
  asset_type VARCHAR(50) DEFAULT 'native',  -- 'native', 'asset', 'soroban_token'
  asset_code VARCHAR(12),                   -- Código para assets regulares
  asset_issuer VARCHAR(255),                -- Emisor para assets regulares
  contract_id VARCHAR(255),                 -- ID de contrato para tokens Soroban
  contract_network VARCHAR(50),             -- 'testnet', 'mainnet' o 'custom'
  tx_hash VARCHAR(255),
  memo TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (from_address) REFERENCES users(address) ON DELETE CASCADE
);

-- Índices para la tabla transactions
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_contract_id ON transactions(contract_id);

-- Tabla para almacenar información de tokens personalizados de Soroban
CREATE TABLE IF NOT EXISTS soroban_tokens (
  id SERIAL PRIMARY KEY,
  contract_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  symbol VARCHAR(50),
  decimals INTEGER DEFAULT 7,
  admin_address VARCHAR(255),
  network VARCHAR(50) DEFAULT 'testnet',
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para la tabla soroban_tokens
CREATE INDEX IF NOT EXISTS idx_soroban_tokens_contract_id ON soroban_tokens(contract_id);
CREATE INDEX IF NOT EXISTS idx_soroban_tokens_symbol ON soroban_tokens(symbol);

-- Tabla para almacenar balances de usuarios de tokens personalizados
CREATE TABLE IF NOT EXISTS user_token_balances (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(255) NOT NULL,
  token_type VARCHAR(50) NOT NULL,  -- 'asset', 'soroban_token'
  asset_code VARCHAR(12),           -- Para assets regulares
  asset_issuer VARCHAR(255),        -- Para assets regulares
  contract_id VARCHAR(255),         -- Para tokens Soroban
  balance NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_address) REFERENCES users(address) ON DELETE CASCADE,
  UNIQUE(user_address, token_type, asset_code, asset_issuer, contract_id)
);

-- Índices para la tabla user_token_balances
CREATE INDEX IF NOT EXISTS idx_user_token_balances_user_address ON user_token_balances(user_address);
CREATE INDEX IF NOT EXISTS idx_user_token_balances_contract_id ON user_token_balances(contract_id);

-- Función para actualizar el timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_agent_limits_updated_at
BEFORE UPDATE ON agent_limits
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_soroban_tokens_updated_at
BEFORE UPDATE ON soroban_tokens
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Función para actualizar last_updated en balances
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.last_updated = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger para actualizar last_updated en balances
CREATE TRIGGER update_user_token_balances_last_updated
BEFORE UPDATE ON user_token_balances
FOR EACH ROW
EXECUTE PROCEDURE update_last_updated_column(); 