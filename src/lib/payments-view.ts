import type { BadgeTone } from "./member-ui";
import { PAYMENT_MODE_OPTIONS } from "./member-form";
import {
  getInitials,
  type PaymentDto,
  type PaymentModeDto,
} from "./members-api";

/* -- Status + method presentation ----------------------------------------- */

/**
 * The payments API stores a free-form `status` string (defaults to
 * `"SUCCESS"`). These helpers map whatever the backend returns onto the
 * design-system badge tones without inventing new statuses.
 */
const STATUS_TONES: Record<string, BadgeTone> = {
  SUCCESS: "success",
  PAID: "success",
  COMPLETED: "success",
  SETTLED: "success",
  PENDING: "warning",
  PROCESSING: "warning",
  FAILED: "danger",
  DECLINED: "danger",
  VOID: "muted",
  REFUNDED: "neutral",
  CANCELLED: "muted",
};

export function paymentStatusTone(status: string): BadgeTone {
  return STATUS_TONES[status?.toUpperCase()] ?? "neutral";
}

/** `"SUCCESS"` → `"Success"`, leaving unknown strings readable. */
export function paymentStatusLabel(status: string): string {
  if (!status) return "Unknown";
  const key = status.toUpperCase();
  return key.charAt(0) + key.slice(1).toLowerCase();
}

export const PAYMENT_MODE_LABELS: Record<string, string> = Object.fromEntries(
  PAYMENT_MODE_OPTIONS.map((option) => [option.value, option.label]),
);

export function paymentModeLabel(mode: PaymentModeDto): string {
  return PAYMENT_MODE_LABELS[mode] ?? mode;
}

const MODE_TONES: Record<PaymentModeDto, BadgeTone> = {
  CASH: "gold",
  UPI: "neutral",
  CARD: "neutral",
  BANK_TRANSFER: "neutral",
  OTHER: "muted",
};

export function paymentModeTone(mode: PaymentModeDto): BadgeTone {
  return MODE_TONES[mode] ?? "muted";
}

/** Only successful payments count towards collected revenue. */
export function isSuccessful(row: { status: string }): boolean {
  return row.status?.toUpperCase() === "SUCCESS";
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

export function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatDayLabel(key: string): string {
  return parseDateKey(key).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* -- Period window -------------------------------------------------------- */

export type PaymentsPeriod = "today" | "week" | "month" | "all" | "custom";

export const PAYMENT_PERIODS: { value: PaymentsPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
];

/** A half-open free window; `null` bounds are unbounded. */
export type DateWindow = { from: string | null; to: string | null };

export function periodWindow(
  period: PaymentsPeriod,
  anchor: string,
  custom: { from: string; to: string },
): DateWindow {
  switch (period) {
    case "week": {
      const from = startOfWeekKey(anchor);
      return { from, to: addDaysKey(from, 6) };
    }
    case "month":
      return { from: startOfMonthKey(anchor), to: endOfMonthKey(anchor) };
    case "custom": {
      const from = custom.from <= custom.to ? custom.from : custom.to;
      const to = custom.from <= custom.to ? custom.to : custom.from;
      return { from, to };
    }
    case "all":
      return { from: null, to: null };
    case "today":
    default:
      return { from: anchor, to: anchor };
  }
}

export function inWindow(dateKey: string, window: DateWindow): boolean {
  if (window.from && dateKey < window.from) return false;
  if (window.to && dateKey > window.to) return false;
  return true;
}

export function windowLabel(window: DateWindow, fallback: string): string {
  if (!window.from && !window.to) return fallback;
  if (window.from && window.to) {
    if (window.from === window.to) return formatDayLabel(window.from);
    return `${formatDayLabel(window.from)} – ${formatDayLabel(window.to)}`;
  }
  if (window.from) return `From ${formatDayLabel(window.from)}`;
  return `Until ${formatDayLabel(window.to as string)}`;
}

/* -- Row model ------------------------------------------------------------ */

export type PaymentRow = {
  id: string;
  receiptNumber: string;
  memberId: string;
  memberName: string;
  memberInitials: string;
  memberCode: string;
  /** Amount in paise (minor units), as stored by the backend/app. */
  amountPaise: number;
  paymentMode: PaymentModeDto;
  modeLabel: string;
  reference: string | null;
  /** Local calendar day (`YYYY-MM-DD`) of the payment date. */
  dateKey: string;
  /** ISO instant used for display of the payment date. */
  paymentDate: string;
  paidAt: string;
  status: string;
  raw: PaymentDto;
};

export function toPaymentRow(payment: PaymentDto): PaymentRow {
  const at = payment.paymentDate ?? payment.paidAt;
  return {
    id: payment.id,
    receiptNumber: payment.receiptNumber,
    memberId: payment.memberId,
    memberName: payment.member?.name ?? "Unknown member",
    memberInitials: getInitials(payment.member?.name ?? "?"),
    memberCode: payment.member?.memberCode ?? "—",
    amountPaise: payment.amount,
    paymentMode: payment.paymentMode,
    modeLabel: paymentModeLabel(payment.paymentMode),
    reference: payment.reference,
    dateKey: toDateKey(new Date(at)),
    paymentDate: at,
    paidAt: payment.paidAt,
    status: payment.status ?? "SUCCESS",
    raw: payment,
  };
}

export function toPaymentRows(payments: PaymentDto[]): PaymentRow[] {
  return payments.map(toPaymentRow);
}

/* -- Summary -------------------------------------------------------------- */

export type PaymentMethodSummary = {
  mode: PaymentModeDto;
  label: string;
  count: number;
  totalPaise: number;
};

export type PaymentsSummary = {
  collectedPaise: number;
  count: number;
  averagePaise: number;
  todayPaise: number;
  todayCount: number;
  byMode: PaymentMethodSummary[];
};

export function summarizePayments(
  rows: PaymentRow[],
  today: string,
): PaymentsSummary {
  let collectedPaise = 0;
  let count = 0;
  let todayPaise = 0;
  let todayCount = 0;
  const byMode = new Map<PaymentModeDto, PaymentMethodSummary>();

  for (const row of rows) {
    if (!isSuccessful(row)) continue;
    collectedPaise += row.amountPaise;
    count += 1;
    if (row.dateKey === today) {
      todayPaise += row.amountPaise;
      todayCount += 1;
    }
    const existing = byMode.get(row.paymentMode);
    if (existing) {
      existing.count += 1;
      existing.totalPaise += row.amountPaise;
    } else {
      byMode.set(row.paymentMode, {
        mode: row.paymentMode,
        label: row.modeLabel,
        count: 1,
        totalPaise: row.amountPaise,
      });
    }
  }

  return {
    collectedPaise,
    count,
    averagePaise: count > 0 ? Math.round(collectedPaise / count) : 0,
    todayPaise,
    todayCount,
    byMode: [...byMode.values()].sort((a, b) => b.totalPaise - a.totalPaise),
  };
}
