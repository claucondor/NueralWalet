# GuardWallet (NeuralWallet)

A revolutionary decentralized finance platform built on Stellar blockchain with AI assistance, decentralized credit scoring, and collaborative financial tools.

![GuardWallet Logo](/app/public/logo/logo@vector.svg)

## Overview

GuardWallet combines the power of blockchain technology with artificial intelligence to create a user-friendly and inclusive financial ecosystem. The project aims to make decentralized finance accessible to everyone, regardless of their technical knowledge.

Key innovations include:
- AI-powered financial assistant for natural language interactions
- Decentralized credit scoring system inspired by Stellar's BLEND protocol
- Friend Vaults for collaborative savings and investment
- Multisignature security for safe asset management

## Project Structure

The project consists of two main components:

1. **[Frontend Application](/app)** - React-based user interface with Web3Auth integration
2. **[Stellar Backend](/stellar-kit)** - API service for blockchain interactions and DeFi functionality

## Quick Start

### Prerequisites
- Node.js (v16+)
- Bun (latest version)
- Git

### Installation

```bash
# Clone the repository
git clone .
# or download the repository

# Install root dependencies
npm install

# Set up frontend
cd app
npm install
cp .env.example .env
# Fill in the required environment variables

# Set up backend
cd ../stellar-kit
npm install
cp .env.example .env
# Fill in the required environment variables
```

### Running the Application

1. Start the backend service:
```bash
cd stellar-kit
npm run dev
```

2. Start the frontend application:
```bash
cd app
npm run dev
```

## Key Features

### Decentralized Credit System

Our credit system uses blockchain data to create reputation scores that enable trustless lending:

- Credit scoring based on transaction history and social connections
- Distributed risk across multiple lenders
- Isolated lending pools with mandatory insurance
- Integration with Stellar's BLEND protocol concepts
- Community-managed fee pool to cover defaults

### Friend Vaults

Collaborative financial tools that allow groups to:

- Create shared wallets with multisig security
- Collectively manage funds with customizable governance
- Build social trust that improves credit scores
- Establish micro-lending circles within communities

### AI Financial Assistant

Natural language interface for financial management:

- Execute transactions through conversation
- Get personalized financial insights
- Learn about blockchain and finance concepts
- Manage assets and monitor portfolio

### Multisignature Security

Enhanced security through distributed control:

- Requires multiple signatures for high-value transactions
- Prevents single points of failure
- Supports group governance for shared funds
- Manages lending collateral with threshold controls

## Documentation

For more detailed information, please refer to the component README files:

- [Frontend Application Documentation](/app/README.md)
- [Stellar Kit Documentation](/stellar-kit/README.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details. 