/**
 * Typed client for the existing Express auth API (`/api/v1/auth/*`,
 * backed by Better Auth on the server).
 *
 * All requests run with `withCredentials: true` (see `lib/api.ts`), so the
 * HttpOnly session cookie set by the backend is sent automatically. No token
 * is ever read or stored in JavaScript.
 */

import { apiRequest } from "./api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  gymId?: string | null;
  role?: string | null;
  emailVerified?: boolean;
  image?: string | null;
};

export type CurrentSession = {
  user: AuthUser;
  session: { id?: string; expiresAt?: string } | null;
};

export type SignupInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type SetupGymInput = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
};

export type SubscriptionStatus = {
  subscription: {
    id: string;
    status: "TRIALING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "PAST_DUE";
    planNameSnapshot?: string | null;
    trialStartsAt?: string | null;
    trialEndsAt?: string | null;
    currentPeriodEnd?: string | null;
    remainingTrialDays?: number;
  } | null;
  entitled: boolean;
  expiresAt: string | null;
  remainingDays: number;
  reason: string;
};

/** Create the account and trigger the verification OTP email. */
export function signup(input: SignupInput) {
  return apiRequest<{ message: string; user: AuthUser | null }>("/auth/signup", {
    method: "POST",
    body: input,
  });
}

/** Verify the 6-digit email OTP; on success the backend sets the session. */
export function verifyEmailOtp(input: { email: string; otp: string }) {
  return apiRequest<unknown>("/auth/verify-email", { method: "POST", body: input });
}

/** Request a new OTP for the pending signup (rate-limited server-side). */
export function resendOtp(email: string) {
  return apiRequest<{ message: string }>("/auth/resend-otp", {
    method: "POST",
    body: { email },
  });
}

/** Email + password sign-in. 403 means the email is not verified yet. */
export function login(input: LoginInput) {
  return apiRequest<unknown>("/auth/login", { method: "POST", body: input });
}

/** Current user + gym context from the session cookie; throws ApiError(401) when signed out. */
export function fetchCurrentUser() {
  return apiRequest<CurrentSession>("/auth/me");
}

/** End the session (server clears the cookie). */
export function logout() {
  return apiRequest<unknown>("/auth/logout", { method: "POST" });
}

/**
 * Start the Google OAuth flow. The backend returns the Google consent URL;
 * the browser must be redirected there. `callbackURL` must be same-origin
 * with the configured CLIENT_ORIGIN or the backend rejects it.
 */
export function getGoogleSignInUrl(callbackURL: string) {
  return apiRequest<{ url: string }>("/auth/google", {
    method: "POST",
    body: { callbackURL },
  });
}

/** Create the gym for the signed-in owner and start the free trial (backend-side). */
export function setupGym(input: SetupGymInput) {
  return apiRequest<{ id: string; name: string; phone?: string | null }>("/auth/setup-gym", {
    method: "POST",
    body: input,
  });
}

/** Start the password-reset flow; the backend emails a reset link. */
export function forgotPassword(email: string) {
  return apiRequest<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

/** Complete the password reset with the emailed token. */
export function resetPassword(token: string, newPassword: string) {
  return apiRequest<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: { token, newPassword },
  });
}

/** Subscription/trial status for the authenticated gym. */
export function fetchSubscription() {
  return apiRequest<SubscriptionStatus>("/subscription/me");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sanitize a post-login redirect target. Only same-app paths are allowed —
 * external URLs, protocol-relative URLs and auth routes are rejected.
 */
export function safeNext(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\s"\\<>\u0000-\u001f]/.test(value)) return fallback;
  const authPages = ["/login", "/signup", "/verify-email", "/auth/callback"];
  if (authPages.some((page) => value === page || value.startsWith(`${page}?`) || value.startsWith(`${page}/`))) {
    return fallback;
  }
  return value;
}

/** Mask an email for display: "jo•••n@example.com" -> "j•••n@example.com". */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  if (!domain) return email;
  const head = local.slice(0, 1);
  return `${head}•••@${domain}`;
}

/** Build the login URL, preserving where the user was heading. */
export function loginUrlWithNext(next: string): string {
  return next && next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login";
}

// ---------------------------------------------------------------------------
// Pending signup (gym details collected before the account exists)
// ---------------------------------------------------------------------------
//
// The backend creates the *user* at signup and the *gym* (plus its 14-day
// trial) via POST /auth/setup-gym after the email is verified. Gym details
// are kept in sessionStorage for the few seconds between those two steps and
// are cleared as soon as the gym is created.

const PENDING_SIGNUP_KEY = "darkgold:pending-signup";

export type PendingSignup = {
  email: string;
  gymName: string;
  gymPhone?: string;
  gymAddress?: string;
};

export function savePendingSignup(pending: PendingSignup): void {
  try {
    window.sessionStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(pending));
  } catch {
    // Storage unavailable (private mode) — setup-gym page becomes the fallback.
  }
}

export function readPendingSignup(email?: string): PendingSignup | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_SIGNUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSignup;
    if (!parsed?.email || !parsed?.gymName) return null;
    // Only reuse it for the account that is actually being verified.
    if (email && parsed.email !== email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingSignup(): void {
  try {
    window.sessionStorage.removeItem(PENDING_SIGNUP_KEY);
  } catch {
    // Ignore — nothing sensitive beyond the gym name.
  }
}
