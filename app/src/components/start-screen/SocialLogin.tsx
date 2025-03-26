import * as React from "react";
import { cn } from "@/lib/utils";

interface SocialButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  iconAlt?: string;
}

const SocialButton = React.forwardRef<HTMLButtonElement, SocialButtonProps>(
  ({ className, icon, iconAlt = "icon", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "justify-center items-center border border-[#EDEDED] flex min-h-12 w-full gap-2 px-5 py-3 rounded-xl border-solid transition-colors hover:bg-gray-50",
          className,
        )}
        {...props}
      >
        <img
          src={icon}
          alt={iconAlt}
          className="aspect-[1] object-contain w-6 self-stretch shrink-0 my-auto"
        />
        <span className="self-stretch my-auto">{children}</span>
      </button>
    );
  },
);

SocialButton.displayName = "SocialButton";

interface SocialLoginProps {
  className?: string;
}

export function SocialLogin({ className }: SocialLoginProps) {
  return (
    <div className={cn("w-full text-[#1E1E1E] text-center", className)}>
      <p className="text-sm text-gray-500 mb-3">
        Social login options available through Web3Auth
      </p>
    </div>
  );
}
