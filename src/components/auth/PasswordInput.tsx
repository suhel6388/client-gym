"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

export type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Announced to screen readers on the visibility toggle. */
  label?: string;
};

/**
 * Password input with an accessible show/hide toggle. The toggle is a real
 * button with aria-pressed, and never clears what the user typed.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, label = "password", ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(
            "h-10 w-full rounded-lg border border-auth-line bg-[#0b0b0b] px-3 pr-10 text-[13.5px] text-auth-ink outline-none transition-colors placeholder:text-auth-faint",
            "focus:border-auth-gold/60 focus:ring-2 focus:ring-auth-gold/15 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-1 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-auth-muted transition-colors hover:text-auth-ink"
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff className="size-4" strokeWidth={2} aria-hidden />
          ) : (
            <Eye className="size-4" strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>
    );
  },
);
