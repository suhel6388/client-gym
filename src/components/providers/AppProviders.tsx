"use client";

import type { ReactNode } from "react";
import { LoadingProvider } from "./LoadingProvider";
import { ToastProvider } from "./ToastProvider";
import { VisitorTracker } from "@/components/analytics/VisitorTracker";

/** Wraps the app with the global loading overlay, visitor tracking, and toast notifications. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <LoadingProvider>
        <VisitorTracker />
        {children}
      </LoadingProvider>
    </ToastProvider>
  );
}
