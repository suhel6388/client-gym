"use client";

import { Loader2 } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type LoadingContextValue = {
  /** True while at least one async task is in flight. */
  isLoading: boolean;
  /** Increments the active-task counter and shows the overlay. */
  show: (label?: string) => void;
  /** Decrements the active-task counter. */
  hide: () => void;
  /** Convenience helper: shows the loader for the duration of a promise. */
  run: <T>(task: Promise<T>, label?: string) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function useGlobalLoading(): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useGlobalLoading must be used within a LoadingProvider");
  }
  return context;
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [label, setLabel] = useState<string | undefined>(undefined);
  const countRef = useRef(0);

  const show = useCallback((nextLabel?: string) => {
    countRef.current += 1;
    setCount(countRef.current);
    if (nextLabel) setLabel(nextLabel);
  }, []);

  const hide = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1);
    setCount(countRef.current);
    if (countRef.current === 0) setLabel(undefined);
  }, []);

  const run = useCallback(
    async <T,>(task: Promise<T>, taskLabel?: string): Promise<T> => {
      show(taskLabel);
      try {
        return await task;
      } finally {
        hide();
      }
    },
    [show, hide],
  );

  const value = useMemo<LoadingContextValue>(
    () => ({ isLoading: count > 0, show, hide, run }),
    [count, show, hide, run],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {count > 0 && <GlobalLoaderOverlay label={label} />}
    </LoadingContext.Provider>
  );
}

function GlobalLoaderOverlay({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label ? `Loading: ${label}` : "Loading"}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-canvas/60 backdrop-blur-[2px] animate-fade-in"
    >
      <div className="flex items-center gap-3 rounded-xl border border-line-strong bg-elevated px-5 py-4 shadow-pop">
        <Loader2 className="size-5 animate-spin text-gold" strokeWidth={2} aria-hidden />
        <span className="text-sm font-medium text-ink">
          {label ?? "Loading…"}
        </span>
      </div>
    </div>
  );
}
