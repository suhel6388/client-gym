/**
 * Local calendar helpers shared by the date-range reporting features.
 *
 * Everything works on `YYYY-MM-DD` keys in the browser's local timezone so
 * that period filtering, labels and charts all agree with each other.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** A free date window; `null` bounds are unbounded. */
export type DateWindow = { from: string | null; to: string | null };

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** Parses `YYYY-MM-DD` into a local Date at midnight. */
export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function addDaysKey(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Adds calendar months, guarding against month-overflow (e.g. Jan 31 + 1). */
export function addMonthsKey(key: string, months: number): string {
  const date = parseDateKey(key);
  const day = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() < day) date.setDate(0);
  return toDateKey(date);
}

/** Monday-based start of the week containing `key`. */
export function startOfWeekKey(key: string): string {
  const date = parseDateKey(key);
  const weekday = (date.getDay() + 6) % 7; // Mon = 0
  date.setDate(date.getDate() - weekday);
  return toDateKey(date);
}

export function startOfMonthKey(key: string): string {
  const date = parseDateKey(key);
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function endOfMonthKey(key: string): string {
  const date = parseDateKey(key);
  return toDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function startOfYearKey(key: string): string {
  return `${parseDateKey(key).getFullYear()}-01-01`;
}

export function endOfYearKey(key: string): string {
  return `${parseDateKey(key).getFullYear()}-12-31`;
}

export function diffDays(fromKey: string, toKey: string): number {
  return Math.round(
    (parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime()) / DAY_MS,
  );
}

/** Inclusive length of a bounded window, or `null` when unbounded. */
export function dayCount(window: DateWindow): number | null {
  if (!window.from || !window.to) return null;
  return diffDays(window.from, window.to) + 1;
}

export function inWindow(dateKey: string, window: DateWindow): boolean {
  if (window.from && dateKey < window.from) return false;
  if (window.to && dateKey > window.to) return false;
  return true;
}

/** True when `dateKey` falls in the same calendar month as `anchor`. */
export function inMonth(dateKey: string, anchor: string): boolean {
  return dateKey.slice(0, 7) === anchor.slice(0, 7);
}

export function formatDayLabel(key: string): string {
  return parseDateKey(key).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "12 Oct" — compact axis/label format. */
export function formatShortDayLabel(key: string): string {
  return parseDateKey(key).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

/** "Oct 2026" */
export function formatMonthLabel(key: string): string {
  return parseDateKey(key).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function formatTimeOfDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
