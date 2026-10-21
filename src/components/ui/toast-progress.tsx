"use client";

import { cn } from "@/lib/cn";
import type { ToastVariant } from "@/lib/toast";

const toneClasses: Record<ToastVariant, string> = {
  success: "bg-success",
  error: "bg-danger",
  warning: "bg-warning",
  info: "bg-gold",
  loading: "bg-gold/70",
  offline: "bg-subtle",
  subscription: "bg-gradient-to-r from-gold-soft via-gold to-gold-deep",
};

type ToastProgressProps = {
  /** Auto-dismiss delay in ms. Ignored when `indeterminate` is true. */
  duration: number;
  paused: boolean;
  variant: ToastVariant;
  /** Restarts the CSS animation whenever the toast content changes. */
  revision: number;
  /** Loading toasts use an indeterminate sweep instead of a countdown. */
  indeterminate?: boolean;
  className?: string;
};

/**
 * Thin countdown line pinned to the bottom of a toast. The CSS animation is
 * paused in lockstep with the auto-dismiss timer so hover/focus never causes
 * the bar and the timer to disagree.
 */
export function ToastProgress({
  duration,
  paused,
  variant,
  revision,
  indeterminate = false,
  className,
}: ToastProgressProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-white/[0.06]",
        className,
      )}
    >
      {indeterminate ? (
        <span
          key={revision}
          className={cn(
            "toast-progress-indeterminate block h-full w-1/3 rounded-full",
            toneClasses[variant],
          )}
          style={{ animationPlayState: paused ? "paused" : "running" }}
        />
      ) : (
        <span
          key={revision}
          className={cn(
            "toast-progress-bar block h-full w-full origin-left rounded-full",
            toneClasses[variant],
          )}
          style={{
            animationDuration: `${Math.max(duration, 1)}ms`,
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      )}
    </div>
  );
}
