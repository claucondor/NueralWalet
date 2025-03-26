import React from "react";
import TokenItem from "./TokenItem";

interface Token {
  id: string;
  icon: string;
  name: string;
  price: string;
  priceChange: string;
  amount: string;
  symbol: string;
  value: string;
  isPositive?: boolean;
}

interface TokensListProps {
  tokens: Token[];
}

const TokensList: React.FC<TokensListProps> = ({ tokens }) => {
  return (
    <div className="flex flex-col w-full h-full overflow-y-auto p-3 space-y-3">
      {tokens.map((token) => (
        <TokenItem
          key={token.id}
          icon={token.icon}
          name={token.name}
          price={token.price}
          priceChange={token.priceChange}
          amount={token.amount}
          symbol={token.symbol}
          value={token.value}
          isPositive={token.isPositive}
        />
      ))}
    </div>
  );
};

export default TokensList;
