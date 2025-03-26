# GoPay - Web3 for Everyone

<img src="https://github.com/RuyRiver/wallet-ui-lovable/blob/main/public/logo/logo@HD.png?raw=true" alt="GoPay Logo" width="250"/>

## Simplifying Blockchain for the Masses

Imagine asking someone on the street to send you 100 USDT to your wallet. Would they know how? Most likely not. And if we tried to explain wallets, transaction signatures, gas fees, or seed phrases, how long would it take? Too long.

**That's why we created GoPay** - a wallet designed for everyone, regardless of their blockchain knowledge. With GoPay, all you need to know is **how to sign in with your email and how to chat**. From your first moment, you can make blockchain transactions without complications.

## How It Works

- **Easy Registration**: Just your email and password. No seed phrases or complex configurations.
- **Automatic Wallet**: The application generates a wallet for you and securely stores your private key.
- **Intelligent Assistant**: Want to send funds, swap tokens, or check your balance? Just tell the assistant what you need, and it will handle everything.
- **Hassle-free Funding**: You can fund your account with Wise, Skrill, credit card, debit card, and more.

## Business Model

GoPay charges a **1% commission** whenever you fund your account, make a transaction, or swap tokens. This ensures a smooth, secure service without complications.

## Technologies

GoPay is built with a modern tech stack focused on security, performance, and user experience:

- **Frontend**:
  - React with TypeScript
  - Vite for fast building
  - Tailwind CSS for styling
  - shadcn-ui for beautiful UI components

- **Authentication**:
  - [Web3Auth](https://web3auth.io/) for seamless Web3 onboarding and secure key management

- **Backend**:
  - [Supabase](https://supabase.com/) for database and authentication support
  - [Railway](https://railway.app/) for API deployment and hosting

- **Blockchain**:
  - [Move Agent Toolkit](https://github.com/aptos-labs/move-agent-toolkit) for simplified blockchain interactions
  - Aptos blockchain for secure and efficient transactions

- **AI & NLP**:
  - [OpenRouter](https://openrouter.ai/) powering our intelligent assistant
  - Natural language processing for conversational experience

## Project Structure

The project consists of two main components:

1. **Main Web Application** - This repository contains the user interface and frontend logic
2. **Move Agent Service** - A separate service that handles blockchain interactions through natural language processing

## Getting Started

### Environment Setup

This project uses environment variables for configuration. Follow these steps to set up your environment:

1. Create a `.env` file in the root directory of the project.
2. Use the `.env.example` file as a reference for the required variables.
3. Fill in your specific values for each variable:
   - **Supabase**: Set your Supabase URL and anonymous key
   - **Web3Auth**: Add your client ID and select the network (SAPPHIRE_DEVNET or SAPPHIRE_MAINNET)
   - **Aptos**: Configure blockchain network settings
   - **Verifier**: Set the verifier name for Web3Auth

Example:
```
# Supabase configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Web3Auth configuration
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
VITE_WEB3AUTH_NETWORK=SAPPHIRE_DEVNET
```

### Development

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Our Vision

This project is designed for everyone, but especially for people with no blockchain experience who want to enter this world in the simplest way possible.

**With GoPay, you just need your email and chat skills to start using blockchain. It's that simple. 🚀**
