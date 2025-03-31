# NeuralWallet

NeuralWallet is a decentralized finance application built on the Stellar blockchain that revolutionizes the way people manage their finances, access credit, and interact with crypto assets.

## Core Features

### Decentralized Credit Score System
NeuralWallet implements a revolutionary decentralized credit scoring system that allows users to:
- Build a credit history on the blockchain
- Access loans based on their on-chain reputation
- Participate in peer-to-peer lending with reduced risk

### Friend Vault
Friend Vaults enable users to:
- Create collaborative savings or investment pools with friends
- Collectively manage funds with customizable governance
- Share the benefits of pooled liquidity
- Establish trust circles for micro-lending within communities

### Risk Mitigation through Collective Lending
Unlike traditional lending platforms, NeuralWallet distributes loan risk across multiple lenders:
- No single person bears the full risk of default
- Loans are funded by multiple participants
- Integration with Stellar's built-in liquidity pools (similar to BLEND protocol)
- Automatic collateral management and liquidation mechanisms

### Smart Agent Assistant
NeuralWallet features an AI-powered financial assistant that helps users:
- Manage their finances
- Make informed investment decisions
- Execute transactions through natural language
- Learn about blockchain and finance concepts

## Technical Architecture

NeuralWallet consists of two main components:

1. **Front-end Application** (`/app`)
   - React-based UI with TypeScript
   - TailwindCSS for styling
   - Web3Auth integration for secure authentication
   - Agent-based AI financial assistant

2. **Stellar Backend** (`/stellar-kit`)
   - API services for Stellar blockchain interaction
   - Smart contract management for credit score system
   - Transaction processing and verification
   - Pool management for collective lending

## Local Development Setup

### Prerequisites
- Node.js (v16+)
- Bun (latest version)
- Git

### Setting up the Front-end
```bash
# Clone the repository
git clone .
# or download the repository and extract it

# Install front-end dependencies
cd app
npm install
# or with Bun
bun install

# Create your environment file
cp .env.example .env
# Fill in the required environment variables

# Start the development server
npm run dev
# or with Bun
bun run dev
```

### Setting up the Stellar Kit
```bash
# From the root directory
cd stellar-kit

# Install dependencies
npm install
# or with Bun
bun install

# Start the local server
npm run dev
# or with Bun
bun run dev
```

## Environment Variables

### Frontend (.env file in /app directory)
```
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
VITE_STELLARKIT_API_URL=http://localhost:3000
VITE_NETWORK=testnet
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (.env file in /stellar-kit directory)
```
HORIZON_URL=https://horizon-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015
SIGNING_KEY=your_signing_key
```

## Decentralized Credit System Explained

NeuralWallet's credit system is built on the concept of social trust and on-chain reputation:

1. **Credit Score Generation**
   - Based on transaction history
   - Account age and activity
   - Repayment behavior
   - Social connections and trust circles

2. **Lending Pools**
   - Similar to Stellar's BLEND protocol
   - Multiple lenders contribute to each loan
   - Risk is distributed proportionally
   - Interest rates are determined algorithmically based on credit scores

3. **Security Mechanisms**
   - Reserve pools to cover defaults
   - Gradual lending limits that increase with reputation
   - Multi-signature requirements for large transactions
   - Automated risk assessment

4. **Privacy Considerations**
   - Credit scores are publicly verifiable but anonymized
   - Users control what information is shared
   - Zero-knowledge proofs for verification without data exposure

## Friend Vault System

Friend Vaults are a unique feature that allows groups of friends or community members to:

1. **Pool Resources**
   - Create shared wallets with customizable governance
   - Define contribution requirements and withdrawal rules
   - Establish collective spending policies

2. **Build Social Trust**
   - Successful participation in Friend Vaults improves credit scores
   - Creates a network of trusted financial relationships
   - Enables access to better lending terms through group reputation

3. **Use Cases**
   - Savings clubs and rotating credit associations
   - Group investments in assets
   - Community emergency funds
   - Collaborative business funding

## Contributing

We welcome contributions to NeuralWallet! Please see our contributing guidelines and code of conduct in the repository.

## License

NeuralWallet is licensed under [MIT License](LICENSE).
