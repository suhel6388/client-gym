"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageVisit } from "@/lib/visitor-tracker";

/**
 * Headless client component that listens to route changes and records
 * website visitor hits. Internal `/super-admin*` pages are skipped by the tracker.
 */
export function VisitorTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    trackPageVisit(pathname);
  }, [pathname]);

  return null;
}

