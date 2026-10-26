/**
 * Presentation helpers for the Super Admin schedule-call console.
 *
 * The backend stores no explicit status column, so the enquiry status is
 * derived from `callTime` in whole calendar days: "past" is any earlier day,
 * "today" is any time today, and "upcoming" is any later day.
 */

import type { BadgeTone } from "@/components/ui/Badge";
import type {
  ScheduleCallDto,
  ScheduleCallStatusFilter,
} from "@/lib/api";

export type ScheduleCallStatus = "upcoming" | "today" | "past";

type ScheduleCallStatusMeta = {
  label: string;
  tone: BadgeTone;
  description: string;
};

const STATUS_META: Record<ScheduleCallStatus, ScheduleCallStatusMeta> = {
  upcoming: {
    label: "Upcoming",
    tone: "gold",
    description: "The scheduled call is still in the future",
  },
  today: {
    label: "Today",
    tone: "warning",
    description: "The call is due later today",
  },
  past: {
    label: "Past",
    tone: "neutral",
    description: "The scheduled time has already passed",
  },
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
});

/** Stable local calendar key, e.g. `2026-10-27`. */
export function localDateKey(value: Date): string {
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return localDateKey(a) === localDateKey(b);
}

export function scheduleCallStatus(
  call: Pick<ScheduleCallDto, "callTime">,
  now: Date = new Date(),
): ScheduleCallStatus {
  const callTime = new Date(call.callTime);
  if (Number.isNaN(callTime.getTime())) return "past";
  // Bucket by day so the badge, the summary counts and the server-side
  // `status` filter agree: past days, today, then future days.
  if (isSameLocalDay(callTime, now)) return "today";
  if (callTime.getTime() <= now.getTime()) return "past";
  return "upcoming";
}

export function scheduleCallStatusMeta(
  status: ScheduleCallStatus,
): ScheduleCallStatusMeta {
  return STATUS_META[status] ?? STATUS_META.past;
}

/** `27 Oct 2026, 03:30 pm` — the timestamp of the scheduled call. */
export function formatScheduleCallDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

export function formatScheduleCallDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export function formatScheduleCallTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return timeFormatter.format(date);
}

/** "in 2h" / "3d ago" style hint next to the timestamp. */
export function formatCallDistance(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = date.getTime() - Date.now();
  const future = diffMs >= 0;
  const minutes = Math.max(1, Math.round(Math.abs(diffMs) / 60000));
  let label: string;

  if (minutes < 60) label = `${minutes}m`;
  else if (minutes < 60 * 24) label = `${Math.round(minutes / 60)}h`;
  else label = `${Math.round(minutes / (60 * 24))}d`;

  return future ? `in ${label}` : `${label} ago`;
}

export function matchesScheduleCallSearch(
  call: ScheduleCallDto,
  term: string,
): boolean {
  const search = term.trim().toLowerCase();
  if (!search) return true;

  return [
    String(call.id),
    call.clientName,
    call.Mob,
    call.ipAddress,
    call.note ?? "",
    call.callTime,
    call.createdAt,
  ]
    .join(" ")
    .toLowerCase()
    .includes(search);
}

/**
 * Local fallback used when the backend deployment ignores the filter query
 * string. Keeps search, status filtering and ordering identical to the server.
 */
export function filterScheduleCalls(
  calls: ScheduleCallDto[],
  term: string,
  status: ScheduleCallStatusFilter,
  now: Date = new Date(),
): ScheduleCallDto[] {
  return calls.filter((call) => {
    if (!matchesScheduleCallSearch(call, term)) return false;
    if (!status) return true;
    return scheduleCallStatus(call, now) === status;
  });
}

/**
 * Convert an ISO timestamp to the value format used by `<input
 * type="datetime-local">` (local time, no timezone suffix).
 */
export function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (input: number) => `${input}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Convert a `datetime-local` value back to an ISO 8601 UTC timestamp. */
export function fromDateTimeLocalValue(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** Readable label for the derived status filter options. */
export function scheduleCallStatusLabel(
  status: ScheduleCallStatusFilter,
): string {
  if (!status) return "All enquiries";
  return scheduleCallStatusMeta(status).label;
}
