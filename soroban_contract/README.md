# Contrato de Token SEP-20 en Soroban

Este proyecto demuestra cómo crear, compilar y desplegar un token compatible con SEP-20 utilizando Soroban, la plataforma de contratos inteligentes de Stellar.

## Estructura del Proyecto

```
soroban_contract/
├── src/
│   └── lib.rs           # Código fuente del contrato en Rust
├── js/
│   ├── src/
│   │   └── deploy.ts    # Script para desplegar el contrato
│   ├── package.json     # Dependencias JavaScript
│   └── tsconfig.json    # Configuración de TypeScript
└── Cargo.toml           # Dependencias Rust y configuración
```

## Requisitos Previos

1. **Rust y cargo**:
   ```
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Target WASM para Rust**:
   ```
   rustup target add wasm32-unknown-unknown
   ```

3. **Node.js y npm**:
   Descarga e instala desde [nodejs.org](https://nodejs.org/)

4. **Soroban CLI**:
   ```
   cargo install soroban-cli
   ```

## Pasos para Compilar y Desplegar

### 1. Compilar el Contrato

```bash
cd soroban_contract
cargo build --target wasm32-unknown-unknown --release
```

Esto generará un archivo WASM en `target/wasm32-unknown-unknown/release/stellar_token.wasm`.

### 2. Instalar Dependencias JavaScript

```bash
cd js
npm install
```

### 3. Desplegar el Contrato

```bash
cd js
npm start
```

Este comando:
1. Compilará el script TypeScript
2. Generará un nuevo par de claves Stellar para el administrador
3. Fondeará la cuenta con Friendbot (solo en testnet)
4. Cargará el archivo WASM compilado a la red
5. Desplegará el contrato
6. Inicializará el token con los parámetros definidos
7. Acuñará tokens iniciales
8. Guardará la información del contrato en `contract_info.json`

## Personalización del Token

Puedes modificar las propiedades del token en `js/src/deploy.ts`:

```typescript
// Configuración del token
const TOKEN_NAME = 'MyTestToken';      // Cambia el nombre
const TOKEN_SYMBOL = 'MTT';            // Cambia el símbolo
const TOKEN_DECIMALS = 7;              // Cambia los decimales
const INITIAL_MINT_AMOUNT = '1000000'; // Cambia la cantidad inicial
```

## Funciones del Contrato

El contrato implementa el estándar SEP-20 con las siguientes funciones:

- `initialize`: Inicializa el token con metadatos y admin
- `mint`: Acuña nuevos tokens (solo admin)
- `balance`: Obtiene el balance de un usuario
- `transfer`: Transfiere tokens a otra cuenta
- `approve`: Aprueba a un spender para gastar tokens en tu nombre
- `transfer_from`: Permite a un spender autorizado transferir tokens
- `allowance`: Verifica la cantidad que un spender está autorizado a gastar
- `total_supply`: Devuelve la oferta total de tokens

## Interactuar con el Contrato

Una vez desplegado, puedes interactuar con el contrato usando Soroban CLI o la librería Stellar SDK:

### Usando Soroban CLI

```bash
# Ver el balance
soroban invoke --id <CONTRACT_ID> --network testnet \
  --source <TU_SECRET_KEY> \
  --fn balance \
  --arg <DIRECCION_A_CONSULTAR>

# Transferir tokens
soroban invoke --id <CONTRACT_ID> --network testnet \
  --source <TU_SECRET_KEY> \
  --fn transfer \
  --arg <TU_DIRECCION> \
  --arg <DIRECCION_DESTINO> \
  --arg <MONTO_EN_STROOPS>
```

### Usando JavaScript

```javascript
// Ver el balance
const balanceResult = await server.invokeContract({
  contractId: contractId,
  functionName: 'balance',
  args: [new StellarSdk.Address(userPublicKey).toScVal()]
});

// Transferir tokens
const transferResult = await server.invokeContract({
  contractId: contractId,
  functionName: 'transfer',
  args: [
    new StellarSdk.Address(fromPublicKey).toScVal(),
    new StellarSdk.Address(toPublicKey).toScVal(),
    StellarSdk.xdr.ScVal.scvI128(new StellarSdk.ScInt(amount).toI128())
  ]
});
```

## Recursos Adicionales

- [Documentación de Soroban](https://soroban.stellar.org/docs)
- [Estándar SEP-20](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0020.md)
- [Stellar Laboratory](https://laboratory.stellar.org/)
- [Soroban Explorer](https://stellar.expert/explorer/testnet-soroban) 