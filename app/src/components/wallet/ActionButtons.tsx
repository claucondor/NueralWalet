import React from "react";
import ActionButton from "./ActionButton";
import { ArrowDown } from "lucide-react";

interface ActionButtonsProps {
  onSend?: () => void;
  onReceive?: () => void;
  onDeposit?: () => void;
  onSwap?: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSend,
  onReceive,
  onDeposit,
  onSwap,
}) => {
  // Convert the Lucide ArrowDown icon to a data URL
  const arrowDownSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg>`;
  const receiveIconUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(arrowDownSvg)}`;

  return (
    <div className="flex gap-[34px] my-4 justify-center w-full">
      <ActionButton
        icon="https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/385e4d382b635f90a186d9dcbc99c4e972a9dbcc?placeholderIfAbsent=true"
        label="Send"
        onClick={onSend}
      />
      <ActionButton
        icon={receiveIconUrl}
        label="Receive"
        onClick={onReceive}
      />
      <ActionButton
        icon="https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/583bfdb9e9b7d6bfa262d869574a749ecc66e6ee?placeholderIfAbsent=true"
        label="Deposit"
        onClick={onDeposit}
      />
      <ActionButton
        icon="https://cdn.builder.io/api/v1/image/assets/20e65f047558427aa511c5569cf902c1/61a1e28565e84e5016c0eaf45ece7716c9d505b3?placeholderIfAbsent=true"
        label="Swap"
        onClick={onSwap}
      />
    </div>
  );
};

export default ActionButtons;
