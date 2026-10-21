"use client";

import { useEffect, type ReactNode } from "react";
import { ToastViewport } from "@/components/ui/toast-viewport";
import { toast } from "@/lib/toast";

export { useToast, useToastState } from "@/hooks/use-toast";
export { toast } from "@/lib/toast";
export type {
  ToastAction,
  ToastApi,
  ToastOptions,
  ToastRecord,
  ToastState,
  ToastVariant,
} from "@/lib/toast";

const OFFLINE_TOAST_ID = "network-offline";
const ONLINE_TOAST_KEY = "network-restored";

/**
 * Mounts the single global toast viewport.
 *
 * The toast store itself lives in `lib/toast.ts` and is not tied to this
 * component's lifecycle, so toasts survive client-side navigation. The
 * provider is kept as the composition point (and for backwards compatibility
 * with the previous context-based implementation).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  // Connectivity is global, so it belongs with the single toast host rather
  // than in individual screens. The offline notice stays until the connection
  // returns (or the user dismisses it) and de-duplicates repeated events.
  useEffect(() => {
    const showOffline = () => {
      toast.offline(
        "You're offline",
        "Some actions are unavailable until your connection returns.",
        {
          id: OFFLINE_TOAST_ID,
          dedupeKey: OFFLINE_TOAST_ID,
          persistent: true,
          action: {
            label: "Retry",
            onClick: () => {
              if (navigator.onLine) {
                toast.success("Back online", "Your connection was restored.", {
                  dedupeKey: ONLINE_TOAST_KEY,
                });
                return;
              }
              toast.error(
                "Still offline",
                "Check your network connection and try again.",
                {
                  id: OFFLINE_TOAST_ID,
                  dedupeKey: OFFLINE_TOAST_ID,
                  persistent: true,
                },
              );
            },
          },
        },
      );
    };

    const handleOnline = () => {
      toast.dismiss(OFFLINE_TOAST_ID);
      toast.success("Back online", "Your connection was restored.", {
        dedupeKey: ONLINE_TOAST_KEY,
      });
    };

    if (!navigator.onLine) showOffline();

    window.addEventListener("offline", showOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", showOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <>
      {children}
      <ToastViewport />
    </>
  );
}
