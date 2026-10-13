"use client";

import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

export type ToastVariant = "success" | "error" | "info";

type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss delay in ms. Pass 0 to keep it until dismissed. */
  duration?: number;
};

type ToastItem = Required<Omit<ToastOptions, "duration">> & {
  id: number;
  duration: number;
};

type ToastContextValue = {
  toast: (options: ToastOptions) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const variantStyles: Record<
  ToastVariant,
  { icon: typeof CircleCheck; iconClass: string; ring: string }
> = {
  success: {
    icon: CircleCheck,
    iconClass: "text-success",
    ring: "ring-success/30",
  },
  error: {
    icon: CircleAlert,
    iconClass: "text-danger",
    ring: "ring-danger/30",
  },
  info: {
    icon: Info,
    iconClass: "text-gold",
    ring: "ring-gold/30",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    idRef.current += 1;
    const item: ToastItem = {
      id: idRef.current,
      title: options.title,
      description: options.description ?? "",
      variant: options.variant ?? "info",
      duration: options.duration ?? 4200,
    };
    setToasts((current) => [...current, item]);
  }, []);

  const success = useCallback(
    (title: string, description?: string) => toast({ title, description, variant: "success" }),
    [toast],
  );
  const error = useCallback(
    (title: string, description?: string) => toast({ title, description, variant: "error", duration: 6000 }),
    [toast],
  );
  const info = useCallback(
    (title: string, description?: string) => toast({ title, description, variant: "info" }),
    [toast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toast, success, error, info, dismiss }),
    [toast, success, error, info, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 top-4 z-[110] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const { icon: Icon, iconClass, ring } = variantStyles[item.variant];

  useEffect(() => {
    if (!item.duration) return;
    const timer = window.setTimeout(() => onDismiss(item.id), item.duration);
    return () => window.clearTimeout(timer);
  }, [item.id, item.duration, onDismiss]);

  return (
    <div
      role={item.variant === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm animate-pop items-start gap-3 rounded-xl border border-line-strong bg-elevated px-4 py-3 shadow-pop ring-1 ring-inset",
        ring,
      )}
    >
      <Icon className={cn("mt-0.5 size-4.5 shrink-0", iconClass)} strokeWidth={2} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-ink">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-xs leading-relaxed text-subtle">{item.description}</p>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(item.id)}
        className="-mr-1 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-faint transition-colors hover:bg-card-hover hover:text-ink"
      >
        <X className="size-3.5" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
