"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Global theme management.
 *
 * - `attribute="class"` toggles `.dark`/`.light` on <html>, which the design
 *   tokens in globals.css respond to.
 * - `defaultTheme="system"` respects the OS preference on a first visit.
 * - next-themes persists the explicit choice in localStorage under `theme`.
 * - its inline pre-paint script prevents hydration mismatches and flashing.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      storageKey="theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
