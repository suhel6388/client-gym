"use client";

import type { ReactNode } from "react";
import { LoadingProvider } from "./LoadingProvider";
import { ToastProvider } from "./ToastProvider";

/** Wraps the app with the global loading overlay and toast notifications. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <LoadingProvider>{children}</LoadingProvider>
    </ToastProvider>
  );
}
