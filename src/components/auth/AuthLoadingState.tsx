"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type AuthLoadingStateProps = {
  label?: string;
  className?: string;
};

/** Spinner + label for in-progress auth actions (submit buttons, redirects). */
export function AuthLoadingState({ label, className }: AuthLoadingStateProps) {
  return (
    <span className={cn("inline-flex items-center justify-center gap-2", className)} role="status">
      <Loader2 className="size-4 animate-spin motion-reduce:animate-none" strokeWidth={2.25} aria-hidden />
      {label && <span className="text-[13px] font-medium">{label}</span>}
    </span>
  );
}
