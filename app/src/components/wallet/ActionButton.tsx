import React from "react";

interface ActionButtonProps {
  icon: string;
  label: string;
  onClick?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
}) => {
  return (
    <div className="flex flex-col items-center w-14">
      <button
        className="bg-[rgba(39,39,41,1)] flex w-14 items-center gap-2.5 justify-center h-14 px-4 rounded-2xl"
        onClick={onClick}
        aria-label={label}
      >
        <img
          src={icon}
          className="aspect-[1] object-contain w-6 self-stretch my-auto"
          alt={label}
        />
      </button>
      <div className="text-[rgba(39,39,41,1)] text-sm font-medium leading-[1.4] tracking-[0.2px] text-center mt-1">
        {label}
      </div>
    </div>
  );
};

export default ActionButton;
