import { getInitials, type MemberDto, type MembershipWithRelationsDto } from "./members-api";
import type { SubscriptionStatus } from "./membership-view";
import { toSubscriptionStatus } from "./membership-view";
import type { BadgeTone } from "./member-ui";
import type { AttendanceMethod, AttendanceRecordDto } from "./attendance-api";

/* -- Attendance period ---------------------------------------------------- */

export type AttendancePeriod = "today" | "week" | "month" | "custom";

export const ATTENDANCE_PERIODS: { value: AttendancePeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

/* -- Status + method ------------------------------------------------------ */

export type AttendanceStatus = "Checked In" | "Checked Out" | "Absent";

const STATUS_TONES: Record<AttendanceStatus, BadgeTone> = {
  "Checked In": "gold",
  "Checked Out": "neutral",
  Absent: "danger",
};

export function attendanceTone(status: AttendanceStatus): BadgeTone {
  return STATUS_TONES[status] ?? "neutral";
}

export function methodLabel(method: AttendanceMethod | null): string {
  switch (method) {
    case "FINGERPRINT":
      return "Fingerprint";
    case "DEVICE":
      return "Device";
    case "MANUAL":
      return "Manual";
    default:
      return "—";
  }
}

export function methodTone(method: AttendanceMethod | null): BadgeTone {
  switch (method) {
    case "FINGERPRINT":
      return "gold";
    case "DEVICE":
      return "neutral";
    case "MANUAL":
      return "muted";
    default:
      return "muted";
  }
}

/* -- Date helpers --------------------------------------------------------- */

/** Local calendar key (`YYYY-MM-DD`) for a Date. */
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

export function periodRange(
  period: AttendancePeriod,
  anchor: string,
): { from: string; to: string } {
  switch (period) {
    case "week": {
      const from = startOfWeekKey(anchor);
      return { from, to: addDaysKey(from, 6) };
    }
    case "month":
      return { from: startOfMonthKey(anchor), to: endOfMonthKey(anchor) };
    case "today":
    case "custom":
    default:
      return { from: anchor, to: anchor };
  }
}

export function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes < 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export function formatDayLabel(key: string): string {
  return parseDateKey(key).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatRangeLabel(from: string, to: string): string {
  if (from === to) return formatDayLabel(from);
  return `${formatDayLabel(from)} – ${formatDayLabel(to)}`;
}

/* -- Expected population -------------------------------------------------- */

/** True when a membership covers `dateKey` and was not cancelled/frozen. */
export function isMembershipActiveOn(
  membership: MembershipWithRelationsDto,
  dateKey: string,
): boolean {
  const start = membership.startDate.slice(0, 10);
  const end = membership.endDate.slice(0, 10);
  if (dateKey < start || dateKey > end) return false;
  if (
    membership.status === "CANCELLED" ||
    membership.status === "FROZEN" ||
    membership.status === "INACTIVE"
  ) {
    return false;
  }
  return true;
}

/* -- Row model ------------------------------------------------------------ */

export type AttendanceRow = {
  /** Stable key — record id, or a synthetic id for derived absent rows. */
  id: string;
  /** Null for absent rows (no attendance record exists). */
  recordId: string | null;
  memberId: string;
  memberCode: string;
  memberName: string;
  memberInitials: string;
  memberPhone: string;
  planId: string | null;
  planName: string;
  membershipStatus: SubscriptionStatus | "None";
  membershipEndDate: string | null;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  durationMinutes: number | null;
  method: AttendanceMethod | null;
  status: AttendanceStatus;
  notes: string | null;
};

function durationBetween(checkInAt: string, checkOutAt: string | null): number | null {
  if (!checkOutAt) return null;
  const start = new Date(checkInAt).getTime();
  const end = new Date(checkOutAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.max(0, Math.round((end - start) / 60_000));
}

type BuildInput = {
  records: AttendanceRecordDto[];
  members: MemberDto[];
  memberships: MembershipWithRelationsDto[];
  /** When set (single-day range), expected members with no record become Absent rows. */
  absentDateKey: string | null;
};

export function buildAttendanceRows({
  records,
  members,
  memberships,
  absentDateKey,
}: BuildInput): AttendanceRow[] {
  const memberById = new Map(members.map((member) => [member.id, member]));
  const membershipsByMember = new Map<string, MembershipWithRelationsDto[]>();
  for (const membership of memberships) {
    const list = membershipsByMember.get(membership.memberId);
    if (list) list.push(membership);
    else membershipsByMember.set(membership.memberId, [membership]);
  }

  /** The membership that best represents the member (latest end date). */
  const primaryFor = (memberId: string): MembershipWithRelationsDto | null => {
    const list = membershipsByMember.get(memberId);
    if (!list?.length) return null;
    return [...list].sort(
      (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
    )[0];
  };

  const memberIdFor = (memberId: string) => {
    const member = memberById.get(memberId);
    const primary = primaryFor(memberId);
    return {
      memberCode: member?.memberCode ?? "—",
      memberName: member?.name ?? "Unknown member",
      memberInitials: getInitials(member?.name ?? "?"),
      memberPhone: member?.phone ?? "—",
      planId: primary?.plan?.id ?? null,
      planName: primary?.plan?.name ?? "No plan",
      membershipStatus: primary ? toSubscriptionStatus(primary) : ("None" as const),
      membershipEndDate: primary?.endDate ?? null,
    };
  };

  const rows: AttendanceRow[] = records.map((record) => {
    const info = memberIdFor(record.memberId);
    return {
      id: record.id,
      recordId: record.id,
      memberId: record.memberId,
      ...info,
      date: record.date,
      checkInAt: record.checkInAt,
      checkOutAt: record.checkOutAt,
      durationMinutes: durationBetween(record.checkInAt, record.checkOutAt),
      method: record.method,
      status: record.checkOutAt ? "Checked Out" : "Checked In",
      notes: record.notes,
    };
  });

  if (absentDateKey) {
    const presentMemberIds = new Set(
      records.filter((record) => record.date === absentDateKey).map((record) => record.memberId),
    );
    const expected = members.filter((member) =>
      (membershipsByMember.get(member.id) ?? []).some((membership) =>
        isMembershipActiveOn(membership, absentDateKey),
      ),
    );
    for (const member of expected) {
      if (presentMemberIds.has(member.id)) continue;
      const info = memberIdFor(member.id);
      rows.push({
        id: `absent-${member.id}-${absentDateKey}`,
        recordId: null,
        memberId: member.id,
        ...info,
        date: absentDateKey,
        checkInAt: null,
        checkOutAt: null,
        durationMinutes: null,
        method: null,
        status: "Absent",
        notes: null,
      });
    }
  }

  return rows.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return (b.checkInAt ?? "").localeCompare(a.checkInAt ?? "");
  });
}
