# Stellar Kit for NeuralWallet

The Stellar Kit is the backend service component of NeuralWallet, handling all interactions with the Stellar blockchain. This service enables the secure management of digital assets, credit scoring, and the collective lending features that make NeuralWallet unique.

## Core Features

### Blockchain API Integration
- Complete Stellar blockchain integration
- Transaction creation, signing, and submission
- Account creation and management
- Token handling (both native XLM and custom assets)

### Credit Score System Backend
- Decentralized reputation scoring algorithms
- On-chain credit history tracking
- Secure storage of credit data
- Risk assessment models

### Lending Pool Management
- Integration with Stellar's liquidity protocols (similar to BLEND)
- Multi-party loan distribution and management
- Interest calculation and distribution
- Default risk management

### Friend Vault Infrastructure
- Smart contract management for collaborative wallets
- Multi-signature operations
- Transaction approval workflows
- Group fund management

## Technical Architecture

The Stellar Kit is built with:
- Node.js/TypeScript environment
- Stellar SDK for blockchain interactions
- RESTful API design for front-end communications
- Soroban smart contract support for advanced functionality

## API Endpoints

The service exposes several key endpoints:

### Account Management
- `GET /api/account/balance/:address` - Get account balance
- `POST /api/account/create` - Create a new account
- `GET /api/account/history/:address` - Get transaction history

### Transactions
- `POST /api/transaction/send` - Send XLM or tokens
- `POST /api/transaction/sendByEmail` - Send assets using email address
- `POST /api/transaction/swap` - Swap between different assets

### Credit System
- `GET /api/credit/score/:address` - Get credit score
- `GET /api/credit/history/:address` - Get credit history
- `POST /api/credit/apply` - Apply for a loan

### Friend Vaults
- `POST /api/vault/create` - Create a new friend vault
- `GET /api/vault/list/:address` - List user's vaults
- `POST /api/vault/contribute` - Contribute to a vault
- `POST /api/vault/withdraw` - Withdraw from a vault

## Local Development Setup

```bash
# Clone the repository if you haven't already
git clone .
# or download the repository and extract it

# Navigate to the stellar-kit directory
cd stellar-kit

# Install dependencies
npm install
# or
bun install

# Setup environment variables
cp .env.example .env
# Edit .env file with your Stellar credentials

# Start development server
npm run dev
# or
bun run dev
```

## Environment Configuration

Create a `.env` file with the following variables:

```
# Stellar Network Configuration
HORIZON_URL=https://horizon-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Authentication
SIGNING_KEY=your_stellar_signing_key

# API Configuration
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Additional Services
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## Decentralized Credit System Implementation

The Stellar Kit implements a groundbreaking approach to credit scoring that:

1. **Analyzes on-chain reputation:**
   - Transaction regularity and history
   - Asset holding patterns
   - Network of trusted counterparties

2. **Implements risk distribution through multi-party lending:**
   - No single lender bears the full risk of a loan
   - Risk is distributed across multiple participants
   - Loan amounts are fractionally assigned based on lender parameters

3. **Utilizes Stellar's native features:**
   - Time-bound transactions for automatic loan terms
   - Multi-signature escrow for collateral management
   - Path payments for efficient fund distribution

## Friend Vault Technical Implementation

Friend Vaults are implemented as:

1. **Multi-signature Stellar accounts:**
   - Configurable transaction thresholds
   - Custom signing weight distribution
   - Time-locked operations for certain actions

2. **Smart governance through Soroban contracts:**
   - Voting mechanisms for fund allocation
   - Automated distribution based on predefined rules
   - Transparency and auditability of all operations

3. **Risk mitigation features:**
   - Circuit breakers for suspicious activity
   - Gradual withdrawal limitations
   - Trust score adjustments based on behavior

## Security Considerations

The Stellar Kit implements several security measures:

- Private key encryption for all sensitive operations
- Rate limiting on API endpoints
- Transaction signing verification
- Thorough input validation
- Audit logging of all sensitive operations

## Contributing

Contributions to improving the Stellar Kit are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.