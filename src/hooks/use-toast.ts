"use client";

import { useSyncExternalStore } from "react";
import {
  getServerToastSnapshot,
  getToastSnapshot,
  subscribeToToasts,
  toast,
  type ToastApi,
  type ToastState,
} from "@/lib/toast";

/**
 * Access the global toast API.
 *
 * The returned value is stable for the lifetime of the app and is also
 * callable, so both styles work:
 *
 *   const toast = useToast();
 *   toast.success("Saved", "Your changes are live.");
 *   toast({ title: "Saved", variant: "success" });
 *
 *   const { toast } = useToast(); // same object
 */
export function useToast(): ToastApi {
  return toast;
}

/** Subscribe to the visible/queued toast lists (used by the viewport). */
export function useToastState(): ToastState {
  return useSyncExternalStore(
    subscribeToToasts,
    getToastSnapshot,
    getServerToastSnapshot,
  );
}
