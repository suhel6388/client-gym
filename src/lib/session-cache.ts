import type { AuthUser } from "./api";

/**
 * Optimistic, in-memory session snapshot.
 *
 * This is NOT a credential and it is NOT persisted. It only lets the client
 * paint the authenticated shell immediately after a successful login (or after
 * a verification/setup step) while `GET /auth/me` revalidates in the
 * background. The backend remains the authority for every request.
 *
 * Module scope is deliberate: it survives client-side route changes but is
 * gone after a full reload, so a stale snapshot can never outlive the tab.
 */
let cachedUser: AuthUser | null = null;
let cachedAt = 0;

/** Ignore very old snapshots; the background check will rehydrate instead. */
const MAX_AGE_MS = 30 * 60 * 1000;

export function seedSessionUser(user: AuthUser | null | undefined): void {
  cachedUser = user ?? null;
  cachedAt = cachedUser ? Date.now() : 0;
}

export function readCachedSessionUser(): AuthUser | null {
  if (typeof window === "undefined" || !cachedUser) return null;
  if (Date.now() - cachedAt > MAX_AGE_MS) {
    cachedUser = null;
    cachedAt = 0;
    return null;
  }
  return cachedUser;
}

export function clearCachedSessionUser(): void {
  cachedUser = null;
  cachedAt = 0;
}

/** True when two snapshots describe the same account state. */
export function isSameSessionUser(
  a: AuthUser | null,
  b: AuthUser | null,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.email === b.email &&
    a.phone === b.phone &&
    a.gymId === b.gymId &&
    a.role === b.role &&
    a.emailVerified === b.emailVerified &&
    a.image === b.image
  );
}
