// Token configuration file for GoPay wallet

export interface Token {
  symbol: string;         // Token symbol (e.g., APT)
  name: string;           // Full token name (e.g., Aptos Coin)
  decimals: number;       // Number of decimals for display
  icon?: string;          // Path to token icon
  contractAddress: string; // Token contract address
  isNative?: boolean;     // Whether this is the native token
}

// List of tokens supported by the wallet
export const tokens: Token[] = [
  {
    symbol: 'APT',
    name: 'Aptos Coin',
    decimals: 8,
    contractAddress: '0x1::aptos_coin::AptosCoin',
    isNative: true,
    icon: '/tokens/aptos.svg' // Will be added later
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