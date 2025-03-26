import * as React from "react";

interface LogoProps {
  src: string;
  alt?: string;
  className?: string;
}

export function Logo({ src, alt = "Logo", className = "" }: LogoProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`aspect-[1] object-contain w-20 self-center ${className}`}
    />
  );
}
