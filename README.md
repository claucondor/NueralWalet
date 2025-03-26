# GuardWallet

A library for managing Stellar tokens and wallets, with support for SEP-41 tokens on Soroban.

## Features

- Complete Stellar account management (creation, funding, transfers)
- Support for SEP-41 tokens on Soroban
- Token loading from deployment files or directly from the blockchain
- Token operations: transfer, mint, burn, approvals
- Secure account storage
- Compatibility with testnet and mainnet

## Installation

```bash
npm install
```

## Basic Usage

### Example: Loading and using a token

```typescript
import { StellarWalletKit } from './lib';

// Create a StellarWalletKit instance (using testnet)
const walletKit = new StellarWalletKit(true);

// Load a token from its ID
const tokenInfo = await walletKit.loadToken('CONTRACT_ID_HERE');

// Or load from a deployment file
// const tokenInfo = await walletKit.loadTokenFromFile('path/to/deployment.json');

console.log(`Token: ${tokenInfo.name} (${tokenInfo.symbol})`);

// Get balance
const balance = await walletKit.getTokenBalance(tokenInfo.contractId, 'ACCOUNT_ADDRESS');
console.log(`Balance: ${balance.formattedBalance} ${tokenInfo.symbol}`);
```

## Tests

To run the tests, use:

```bash
cd src/tests
npx ts-node testWallet.ts  # to test wallet operations
npx ts-node testToken.ts   # to test token operations
```