"use client";

import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type AuthErrorMessageProps = {
  /** Main message. Leave empty to render nothing. */
  message?: string | null;
  /** Optional secondary hint (e.g. "A new code was sent to your email."). */
  hint?: React.ReactNode;
  className?: string;
};

/** Inline, accessible error banner for auth forms. */
export function AuthErrorMessage({ message, hint, className }: AuthErrorMessageProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/[0.07] px-3.5 py-3",
        className,
      )}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={2} aria-hidden />
      <div className="min-w-0">
        <p className="text-[13px] font-medium leading-snug text-auth-ink">{message}</p>
        {hint && <p className="mt-1 text-xs leading-relaxed text-auth-muted">{hint}</p>}
      </div>
    </div>
  );
}
