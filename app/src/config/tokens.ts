// Token configuration file for NeuralWallet wallet

export interface Token {
  symbol: string;         // Token symbol (e.g., XLM)
  name: string;           // Full token name (e.g., Stellar Lumens)
  decimals: number;       // Number of decimals for display
  icon?: string;          // Path to token icon
  contractAddress: string; // Token identifier
  isNative?: boolean;     // Whether this is the native token
  issuer?: string;        // Stellar token issuer (null for native XLM)
}

// List of tokens supported by the wallet
export const tokens: Token[] = [
  {
    symbol: 'XLM',
    name: 'Stellar Lumens',
    decimals: 7,
    contractAddress: 'native',
    isNative: true,
    icon: '/tokens/stellar.svg' // Will be added later
  },
  // Example of a custom token on Stellar - adjust as needed
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 7, 
    contractAddress: 'USDC',
    issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', // Testnet USDC issuer (example)
    icon: '/tokens/usdc.svg'
  }
];

// Default token (used when no token is selected)
export const defaultToken = tokens[0];

// Get token by symbol
export const getTokenBySymbol = (symbol: string): Token | undefined => {
  return tokens.find(token => token.symbol === symbol);
};

// Get token by contract address
export const getTokenByAddress = (address: string): Token | undefined => {
  return tokens.find(token => token.contractAddress === address);
};

// Get token by both address and issuer (for Stellar custom assets)
export const getTokenByAddressAndIssuer = (address: string, issuer?: string): Token | undefined => {
  if (!issuer) {
    // For native XLM
    return tokens.find(token => token.contractAddress === address && token.isNative);
  }
  // For custom assets
  return tokens.find(token => 
    token.contractAddress === address && 
    token.issuer === issuer
  );
};