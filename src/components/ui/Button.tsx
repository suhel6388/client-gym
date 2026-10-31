"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "icon";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "gold-surface text-[#1A1503] font-semibold shadow-gold hover:brightness-110 active:brightness-95",
  secondary:
    "border border-line bg-card text-ink hover:border-line-strong hover:bg-card-hover",
  ghost:
    "text-subtle hover:bg-card hover:text-ink",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-10 rounded-lg px-3 text-xs gap-1.5 sm:h-8",
  md: "h-10 rounded-lg px-4 text-sm gap-2 sm:h-9.5",
  icon: "size-10 rounded-lg p-0 sm:size-9",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "secondary", size = "md", type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap transition-[background-color,border-color,box-shadow,filter] duration-150 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);