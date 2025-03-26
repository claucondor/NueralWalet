import * as React from "react";
import { cn } from "@/lib/utils";

interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, text, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex w-full items-center gap-2", className)}
        {...props}
      >
        <div className="bg-[rgba(217,217,217,1)] self-stretch flex h-px flex-1 basis-[0%] my-auto" />
        {text && <div className="self-stretch my-auto">{text}</div>}
        <div className="bg-[rgba(217,217,217,1)] self-stretch flex h-px flex-1 basis-[0%] my-auto" />
      </div>
    );
  },
);

Divider.displayName = "Divider";

export { Divider };
