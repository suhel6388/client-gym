"use client";

import {
  CircleCheck,
  CircleX,
  Crown,
  Info,
  LoaderCircle,
  TriangleAlert,
  WifiOff,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/cn";
import {
  autoDismissToast,
  finalizeToastDismiss,
  toast,
  type ToastRecord,
  type ToastVariant,
} from "@/lib/toast";
import { ToastProgress } from "./toast-progress";

const variantMeta: Record<
  ToastVariant,
  {
    icon: typeof CircleCheck;
    iconClass: string;
    borderClass: string;
    shadowClass: string;
  }
> = {
  success: {
    icon: CircleCheck,
    iconClass: "bg-success/12 text-success ring-success/25",
    borderClass: "border-success/20",
    shadowClass: "",
  },
  error: {
    icon: CircleX,
    iconClass: "bg-danger/12 text-danger ring-danger/25",
    borderClass: "border-danger/25",
    shadowClass: "",
  },
  warning: {
    icon: TriangleAlert,
    iconClass: "bg-warning/12 text-warning ring-warning/25",
    borderClass: "border-warning/20",
    shadowClass: "",
  },
  info: {
    icon: Info,
    iconClass: "bg-auth-gold/12 text-auth-gold ring-auth-gold/25",
    borderClass: "border-line",
    shadowClass: "",
  },
  loading: {
    icon: LoaderCircle,
    iconClass: "bg-auth-gold/12 text-auth-gold ring-auth-gold/25",
    borderClass: "border-auth-gold/20",
    shadowClass: "",
  },
  offline: {
    icon: WifiOff,
    iconClass: "bg-warning/12 text-warning ring-warning/25",
    borderClass: "border-warning/20",
    shadowClass: "",
  },
  subscription: {
    icon: Crown,
    iconClass: "bg-auth-gold/15 text-auth-gold-highlight ring-auth-gold/30",
    borderClass: "border-auth-gold/35",
    shadowClass:
      "shadow-[0_18px_44px_-16px_rgba(0,0,0,0.95),0_0_28px_-14px_rgba(212,175,55,0.4)]",
  },
};

type ToastItemProps = {
  item: ToastRecord;
};

/**
 * A single notification card.
 *
 * The card owns its auto-dismiss timer (not the store) so unmounting it on a
 * route change or provider teardown always clears the timeout. Hover, focus
 * and a hidden tab pause both the timer and the progress line together.
 */
export function ToastItem({ item }: ToastItemProps) {
  const meta = variantMeta[item.variant];
  const Icon = item.icon ?? meta.icon;
  const isLoading = item.variant === "loading";

  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [actionPending, setActionPending] = useState(false);

  const remainingRef = useRef(item.duration);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const paused = hovered || focusWithin || !pageVisible || actionPending;
  const timed = item.duration > 0 && !item.dismissing;

  // Content updates (loading -> success, de-duplicated retries) restart the
  // countdown with the new duration.
  useEffect(() => {
    remainingRef.current = item.duration;
    startedAtRef.current = null;
  }, [item.duration, item.revision]);

  useEffect(() => {
    if (!timed) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      startedAtRef.current = null;
      return;
    }

    if (paused) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (startedAtRef.current !== null) {
        remainingRef.current = Math.max(
          0,
          remainingRef.current - (Date.now() - startedAtRef.current),
        );
        startedAtRef.current = null;
      }
      return;
    }

    if (remainingRef.current <= 0) {
      autoDismissToast(item.id);
      return;
    }

    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      startedAtRef.current = null;
      remainingRef.current = 0;
      autoDismissToast(item.id);
    }, remainingRef.current);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (startedAtRef.current !== null) {
        remainingRef.current = Math.max(
          0,
          remainingRef.current - (Date.now() - startedAtRef.current),
        );
        startedAtRef.current = null;
      }
    };
  }, [item.id, item.revision, item.duration, paused, timed]);

  // Don't burn through the countdown while the tab is in the background.
  useEffect(() => {
    const sync = () => setPageVisible(document.visibilityState !== "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const handleAction = useCallback(async () => {
    if (!item.action || actionPending) return;
    setActionPending(true);
    try {
      await item.action.onClick(item.id);
      if (!item.action.keepOpen) toast.dismiss(item.id);
    } catch {
      // Keep the toast open so the action can be retried.
    } finally {
      setActionPending(false);
    }
  }, [actionPending, item.action, item.id]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Escape" || !item.dismissible) return;
      // Keep the key from also closing an underlying drawer or dialog.
      event.stopPropagation();
      toast.dismiss(item.id);
    },
    [item.dismissible, item.id],
  );

  const handleAnimationEnd = useCallback(
    (event: AnimationEvent<HTMLDivElement>) => {
      if (event.animationName === "toast-out") {
        finalizeToastDismiss(item.id);
      }
    },
    [item.id],
  );

  const showProgress =
    item.showProgress &&
    !item.dismissing &&
    (item.duration > 0 || item.variant === "loading");

  return (
    <div
      data-toast-id={item.id}
      data-variant={item.variant}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocusWithin(false);
        }
      }}
      onKeyDown={handleKeyDown}
      onAnimationEnd={handleAnimationEnd}
      className={cn(
        "pointer-events-auto relative w-full max-w-[380px] overflow-hidden rounded-xl border bg-elevated p-3.5 pr-10 text-left",
        "shadow-pop",
        "ring-1 ring-inset ring-line/60",
        meta.borderClass,
        meta.shadowClass,
        item.dismissing
          ? "pointer-events-none animate-toast-out"
          : "animate-toast-in",
      )}
    >
      {item.variant === "subscription" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(120% 130% at 100% 0%, rgba(212,175,55,0.16), transparent 58%)",
          }}
        />
      )}

      <div className="relative z-10 flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
            meta.iconClass,
          )}
          aria-hidden
        >
          <Icon
            className={cn(
              "size-4",
              isLoading && "animate-spin motion-reduce:animate-none",
            )}
            strokeWidth={2}
          />
        </span>

        <div className="min-w-0 flex-1">
          <p className="break-words text-pretty text-[13px] font-semibold leading-5 text-ink">
            {item.title}
          </p>
          {item.description && (
            <p className="mt-0.5 break-words text-pretty text-xs leading-relaxed text-subtle">
              {item.description}
            </p>
          )}

          {item.action && (
            <button
              type="button"
              onClick={() => void handleAction()}
              disabled={actionPending}
              aria-label={item.action.ariaLabel ?? item.action.label}
              className="mt-2.5 inline-flex h-7 items-center gap-1.5 rounded-md border border-auth-gold/30 bg-auth-gold/10 px-2.5 text-[11.5px] font-semibold text-auth-gold-highlight transition-colors hover:border-auth-gold/50 hover:bg-auth-gold/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auth-gold disabled:cursor-wait disabled:opacity-70"
            >
              {actionPending && (
                <LoaderCircle
                  className="size-3 animate-spin motion-reduce:animate-none"
                  strokeWidth={2}
                  aria-hidden
                />
              )}
              {item.action.label}
            </button>
          )}
        </div>
      </div>

      {item.dismissible && (
        <button
          type="button"
          onClick={() => toast.dismiss(item.id)}
          aria-label={`Dismiss: ${item.title}`}
          className="absolute right-1.5 top-1.5 inline-flex size-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-card-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold"
        >
          <X className="size-3.5" strokeWidth={2} aria-hidden />
        </button>
      )}

      {showProgress && (
        <ToastProgress
          duration={item.duration}
          paused={paused || item.dismissing}
          variant={item.variant}
          revision={item.revision}
          indeterminate={isLoading}
        />
      )}
    </div>
  );
}
