-- Esquema para la base de datos del proyecto wallet-ui con Move Agent Kit

-- Tabla para usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  address VARCHAR(255) NOT NULL UNIQUE,
  private_key_half TEXT,
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
  token_type VARCHAR(50) DEFAULT 'APT',
  tx_hash VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (from_address) REFERENCES users(address) ON DELETE CASCADE
);

-- Índices para la tabla transactions
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

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

-- Ya no utilizamos la función y trigger para inicializar automáticamente
-- Los límites se crearán bajo demanda desde la aplicación
-- ELIMINAMOS TODO LO RELACIONADO

-- DROP TRIGGER IF EXISTS create_default_agent_limits ON users;
-- DROP FUNCTION IF EXISTS initialize_default_agent_limits();

-- Permisos de acceso a través de policies RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies para usuarios (solo puede ver/editar sus propios datos)
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid()::text = email);
  
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid()::text = email);

-- Policies para límites de agente (solo puede ver/editar sus propios límites)
CREATE POLICY agent_limits_select_own ON agent_limits
  FOR SELECT USING (
    user_address IN (SELECT address FROM users WHERE email = auth.uid()::text)
  );
  
CREATE POLICY agent_limits_update_own ON agent_limits
  FOR UPDATE USING (
    user_address IN (SELECT address FROM users WHERE email = auth.uid()::text)
  );

-- Policies para transacciones (solo puede ver sus propias transacciones)
CREATE POLICY transactions_select_own ON transactions
  FOR SELECT USING (
    from_address IN (SELECT address FROM users WHERE email = auth.uid()::text)
  );

-- Policy para admin (puede ver todos los datos)
CREATE POLICY admin_select_all ON users
  FOR SELECT USING (auth.email() = 'admin@example.com');
  
CREATE POLICY admin_select_all_limits ON agent_limits
  FOR SELECT USING (auth.email() = 'admin@example.com');
  
CREATE POLICY admin_select_all_transactions ON transactions
  FOR SELECT USING (auth.email() = 'admin@example.com'); 