import React from "react";

interface TokenItemProps {
  icon: string;
  name: string;
  price: string;
  priceChange: string;
  amount: string;
  symbol: string;
  value: string;
  isPositive?: boolean;
}

const TokenItem: React.FC<TokenItemProps> = ({
  icon,
  name,
  price,
  priceChange,
  amount,
  symbol,
  value,
  isPositive = true,
}) => {
  return (
    <div className="w-full">
      <div className="flex w-full gap-[40px_100px] justify-between">
        <div className="flex gap-4">
          <img
            src={icon}
            className="aspect-[1] object-contain w-[38px] shrink-0"
            alt={name}
          />
          <div className="flex flex-col items-stretch">
            <div className="text-[rgba(39,39,41,1)] text-base font-semibold text-left">
              {name}
            </div>
            <div className="flex gap-1 text-xs font-normal mt-1">
              <div className="text-[rgba(140,141,153,1)] text-center">
                {price}
              </div>
              <div
                className={`flex items-center gap-1 ${isPositive ? "text-[rgba(95,200,143,1)]" : "text-red-500"}`}
              >
                <img
                  src={
                    isPositive
                      ? "https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/47b23cad83087256842e4a56ed656e3030229e8e?placeholderIfAbsent=true"
                      : "https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/47b23cad83087256842e4a56ed656e3030229e8e?placeholderIfAbsent=true"
                  }
                  className="aspect-[1] object-contain w-3 self-stretch shrink-0 my-auto"
                  alt={isPositive ? "Up" : "Down"}
                />
                <div className="self-stretch my-auto">{priceChange}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col text-right">
          <div className="flex gap-1 text-base text-[rgba(39,39,41,1)] font-semibold">
            <div className="tracking-[0.2px]">{amount}</div>
            <div>{symbol}</div>
          </div>
          <div className="text-[rgba(140,141,153,1)] text-xs font-normal text-right mt-1">
            {value}
          </div>
        </div>
      </div>
      <div className="border min-h-px w-full mt-4 border-[rgba(147,149,164,0.1)] border-solid" />
    </div>
  );
};

export default TokenItem;
