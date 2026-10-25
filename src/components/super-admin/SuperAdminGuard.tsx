"use client";

import { useEffect, type ReactNode } from "react";
import {
  AuthLoadingScreen,
  useSession,
} from "@/components/auth/SessionProvider";
import {
  DASHBOARD_PATH,
  loginUrlWithNext,
  postAuthDestination,
} from "@/lib/api";

/**
 * Route guard for the platform-owner console.
 *
 * Different from the gym AuthGuard:
 *  - a gym owner / receptionist is sent back to their own dashboard
 *  - a platform admin never enters gym onboarding, even without a gymId
 *  - the backend still rejects every /super-admin request for non-admins, so
 *    this guard is UX only, not the security boundary.
 */
export function SuperAdminGuard({ children }: { children: ReactNode }) {
  const { status, user } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.assign(loginUrlWithNext(next));
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !user) return;

    if (user.emailVerified === false) {
      window.location.assign(
        `/verify-email?email=${encodeURIComponent(user.email)}&reason=dashboard`,
      );
      return;
    }

    if (user.role !== "SUPER_ADMIN") {
      window.location.assign(postAuthDestination(user, DASHBOARD_PATH));
    }
  }, [status, user]);

  if (status === "loading") {
    return <AuthLoadingScreen label="Checking platform access…" />;
  }

  if (status === "unauthenticated") {
    return <AuthLoadingScreen label="Redirecting to sign in…" />;
  }

  if (!user || user.role !== "SUPER_ADMIN" || user.emailVerified === false) {
    return <AuthLoadingScreen label="Opening your workspace…" />;
  }

  return <>{children}</>;
}
