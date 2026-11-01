import type { DashboardView } from "./dashboard-view";

/**
 * Short-lived dashboard snapshot used for instant paint on revisits.
 *
 * The snapshot is keyed by gym/user so one account can never see another
 * account's cached dashboard. It is memory-only and is always followed by a
 * background refresh from the API.
 */
type CacheEntry = {
  key: string;
  view: DashboardView;
  savedAt: number;
};

const MAX_AGE_MS = 30_000;
let entry: CacheEntry | null = null;

function canUseCache(key: string | null | undefined): key is string {
  return typeof window !== "undefined" && Boolean(key);
}

export function readDashboardCache(
  key: string | null | undefined,
): DashboardView | null {
  if (!canUseCache(key) || !entry || entry.key !== key) return null;
  if (Date.now() - entry.savedAt > MAX_AGE_MS) {
    entry = null;
    return null;
  }
  return entry.view;
}

export function writeDashboardCache(
  key: string | null | undefined,
  view: DashboardView,
): void {
  if (!canUseCache(key)) return;
  entry = { key, view, savedAt: Date.now() };
}

export function clearDashboardCache(): void {
  entry = null;
}
