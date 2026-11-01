"use client";

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
import {
  ApiError,
  fetchCurrentUser,
  loginUrlWithNext,
  logout,
  SUPER_ADMIN_PATH,
  type AuthUser,
} from "@/lib/api";
import {
  clearCachedSessionUser,
  isSameSessionUser,
  readCachedSessionUser,
  seedSessionUser,
} from "@/lib/session-cache";
import { clearDashboardCache } from "@/lib/dashboard-cache";
import { LoaderWave } from "@/components/loaders/loaderwave";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

type SessionContextValue = {
  status: SessionStatus;
  user: AuthUser | null;
  /** Re-read the session from the backend (e.g. after gym setup). */
  refresh: () => Promise<AuthUser | null>;
  /** End the session and return to the login screen. */
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

/**
 * Loads the authenticated user from the HttpOnly session cookie via
 * GET /api/v1/auth/me.
 *
 * A successful login returns the user, so the login screen seeds the in-memory
 * snapshot in `lib/session-cache` before navigating. This provider paints that
 * snapshot immediately (no blocking round-trip) and revalidates `/auth/me` in
 * the background. The snapshot is never persisted and the backend still
 * authorizes every request, so it can only ever affect paint timing.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  // Lazy initializers run on the client, so a seeded snapshot paints the shell
  // on the first frame. On the server `readCachedSessionUser()` returns null,
  // which keeps markup stable for a direct visit.
  const [status, setStatus] = useState<SessionStatus>(() =>
    readCachedSessionUser() ? "authenticated" : "loading",
  );
  const [user, setUser] = useState<AuthUser | null>(() => readCachedSessionUser());
  const mountedRef = useRef(true);

  // Skip state updates when the snapshot describes the same account, so a
  // revalidation that changes nothing does not re-render the whole shell.
  const applyUser = useCallback((nextUser: AuthUser | null) => {
    setUser((previous) =>
      isSameSessionUser(previous, nextUser) ? previous : nextUser,
    );
  }, []);

  const load = useCallback(async (): Promise<AuthUser | null> => {
    const fallback = readCachedSessionUser();
    try {
      const current = await fetchCurrentUser();
      if (!mountedRef.current) return current.user;
      // A different account may share this tab; never reuse its dashboard.
      if (fallback && fallback.id !== current.user.id) clearDashboardCache();
      seedSessionUser(current.user);
      applyUser(current.user);
      setStatus("authenticated");
      return current.user;
    } catch (error) {
      if (!mountedRef.current) return null;

      const unauthorized = error instanceof ApiError && error.status === 401;
      if (unauthorized) {
        clearCachedSessionUser();
        clearDashboardCache();
        applyUser(null);
        setStatus("unauthenticated");
        return null;
      }

      // Network/server hiccup: keep the optimistic session so a temporary
      // outage does not throw the user out of the dashboard. The backend will
      // still reject any request if the cookie is actually gone.
      const retained = fallback ?? readCachedSessionUser();
      if (retained) {
        applyUser(retained);
        setStatus("authenticated");
        return retained;
      }

      applyUser(null);
      setStatus("unauthenticated");
      return null;
    }
  }, [applyUser]);

  useEffect(() => {
    mountedRef.current = true;
    // No cache: resolve the session now. With a cache the shell is already
    // painted and this same call only revalidates it.
    void load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch {
      // Even if the call fails, drop the local state and leave.
    }
    clearCachedSessionUser();
    clearDashboardCache();
    if (mountedRef.current) {
      applyUser(null);
      setStatus("unauthenticated");
    }
    // Full navigation so every cached client state is discarded.
    window.location.assign("/login");
  }, [applyUser]);

  const value = useMemo<SessionContextValue>(
    () => ({ status, user, refresh: load, signOut }),
    [status, user, load, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * Client-side route guard for the gym-management area:
 *  - signed out / expired session  -> /login (with a safe return URL)
 *  - signed in but unverified      -> /verify-email (OTP screen)
 *  - signed in but no gym yet      -> /setup-gym (Google signups, onboarding)
 *
 * The backend enforces the same rules: every gym-data endpoint rejects
 * unverified sessions, so this is UX, not the security boundary.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status, user } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      const next = `${window.location.pathname}${window.location.search}`;
      window.location.assign(loginUrlWithNext(next));
    }
  }, [status]);

  // Unverified accounts may hold a session (e.g. right after signup) but must
  // confirm the email before the dashboard is usable. The OTP screen signs
  // them back in automatically after verification.
  useEffect(() => {
    if (status === "authenticated" && user && user.emailVerified === false) {
      window.location.assign(
        `/verify-email?email=${encodeURIComponent(user.email)}&reason=dashboard`,
      );
    }
  }, [status, user]);

  // Platform owners never use the gym dashboard. Send them to the dedicated
  // console instead of treating "no gymId" as incomplete onboarding.
  useEffect(() => {
    if (status === "authenticated" && user?.role === "SUPER_ADMIN") {
      window.location.assign(SUPER_ADMIN_PATH);
    }
  }, [status, user]);

  // Signed in, but the account has no gym yet (fresh Google signup, or the
  // pending signup details were lost). Finish onboarding first — the trial is
  // granted by the backend when the gym is created.
  useEffect(() => {
    if (
      status === "authenticated" &&
      user &&
      user.role !== "SUPER_ADMIN" &&
      user.emailVerified !== false &&
      !user.gymId
    ) {
      window.location.assign("/setup-gym");
    }
  }, [status, user]);

  if (status === "loading") {
    return <AuthLoadingScreen label="Checking your session…" />;
  }

  if (status === "unauthenticated") {
    return <AuthLoadingScreen label="Redirecting to sign in…" />;
  }

  if (user && user.emailVerified === false) {
    return <AuthLoadingScreen label="Verify your email to continue…" />;
  }

  if (user?.role === "SUPER_ADMIN") {
    return <AuthLoadingScreen label="Opening platform console…" />;
  }

  if (user && !user.gymId) {
    return <AuthLoadingScreen label="Finishing your setup…" />;
  }

  return <>{children}</>;
}

/** Full-screen loader used while the session is being resolved. */
export function AuthLoadingScreen({ label }: { label: string }) {
  return (
    <div className="auth-backdrop flex min-h-screen items-center justify-center px-4">
      <div className="animate-auth-fade-up flex flex-col items-center gap-4">
        <LoaderWave size="lg" tone="auth" label={label} />
      </div>
    </div>
  );
}
