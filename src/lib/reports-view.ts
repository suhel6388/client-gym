import {
  addDaysKey,
  addMonthsKey,
  dayCount,
  inWindow,
  startOfMonthKey,
  startOfWeekKey,
  startOfYearKey,
  endOfMonthKey,
  endOfYearKey,
  toDateKey,
  todayKey,
  type DateWindow,
} from "./date-window";
import { isSuccessful, toPaymentRows, type PaymentRow } from "./payments-view";
import { toExpenseRows, type ExpenseRow } from "./expenses-view";
import {
  groupPaymentsByMember,
  toSubscriptionRow,
  type SubscriptionRow,
} from "./membership-view";
import type {
  MemberDto,
  MembershipWithRelationsDto,
  PaymentDto,
} from "./members-api";
import type { ExpenseDto } from "./api";

/* -- Range selection ------------------------------------------------------ */

export type ReportRange =
  | "today"
  | "week"
  | "month"
  | "last3"
  | "last6"
  | "year"
  | "custom";

export const REPORT_RANGES: { value: ReportRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "last3", label: "Last 3 months" },
  { value: "last6", label: "Last 6 months" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom range" },
];

/**
 * Resolves a range preset to a bounded local-date window. Trailing ranges
 * (`last3`/`last6`) cover the 90/180 days ending today; every window is
 * bounded so previous-period comparisons always have the same length.
 */
export function reportWindow(
  range: ReportRange,
  anchor: string,
  custom: { from: string; to: string },
): DateWindow {
  switch (range) {
    case "today":
      return { from: anchor, to: anchor };
    case "week": {
      const from = startOfWeekKey(anchor);
      return { from, to: addDaysKey(from, 6) };
    }
    case "month":
      return { from: startOfMonthKey(anchor), to: endOfMonthKey(anchor) };
    case "last3":
      return { from: addDaysKey(anchor, -89), to: anchor };
    case "last6":
      return { from: addDaysKey(anchor, -179), to: anchor };
    case "year":
      return { from: startOfYearKey(anchor), to: endOfYearKey(anchor) };
    case "custom": {
      const from = custom.from <= custom.to ? custom.from : custom.to;
      const to = custom.from <= custom.to ? custom.to : custom.from;
      return { from, to };
    }
  }
}

/** Same-length window immediately preceding `window`, for delta comparisons. */
export function previousRangeWindow(window: DateWindow): DateWindow | null {
  if (!window.from || !window.to) return null;
  const length = dayCount(window);
  if (!length || length <= 0) return null;
  return {
    from: addDaysKey(window.from, -length),
    to: addDaysKey(window.from, -1),
  };
}

/**
 * Percentage change vs. the previous period. Returns `null` when there is no
 * previous-period baseline to compare against (avoids inventing growth rates).
 */
export function pctChange(current: number, previous: number): number | null {
  if (previous > 0) return ((current - previous) / previous) * 100;
  if (current === 0 && previous === 0) return 0;
  return null;
}

/* -- Row preparation ------------------------------------------------------ */

export type ReportRows = {
  payments: PaymentRow[];
  expenses: ExpenseRow[];
  subscriptions: SubscriptionRow[];
  members: MemberDto[];
};

export function toReportRows(input: {
  payments: PaymentDto[];
  expenses: ExpenseDto[];
  memberships: MembershipWithRelationsDto[];
  members: MemberDto[];
}): ReportRows {
  const payments = toPaymentRows(input.payments);
  const expenses = toExpenseRows(input.expenses);
  const paymentsByMember = groupPaymentsByMember(input.payments);
  const subscriptions = input.memberships.map((membership) =>
    toSubscriptionRow(membership, paymentsByMember),
  );
  return { payments, expenses, subscriptions, members: input.members };
}

function memberJoinKey(member: MemberDto): string | null {
  if (!member.joinedAt) return null;
  const time = new Date(member.joinedAt).getTime();
  if (Number.isNaN(time)) return null;
  return toDateKey(new Date(time));
}

/* -- KPIs ----------------------------------------------------------------- */

export type ReportKpis = {
  revenuePaise: number;
  revenueCount: number;
  revenueDelta: number | null;
  /** Current snapshot across all subscriptions (not range-bound). */
  outstandingPaise: number;
  outstandingCount: number;
  expensesPaise: number;
  expensesCount: number;
  expensesDelta: number | null;
  netPaise: number;
  netDelta: number | null;
  /** Distinct members holding an Active/Expiring subscription right now. */
  activeMembers: number;
  newMembers: number;
  newMembersDelta: number | null;
  /** Distinct members holding an Expired subscription right now. */
  expiredMembers: number;
};

export function computeKpis(
  rows: ReportRows,
  window: DateWindow,
  prev: DateWindow | null,
): ReportKpis {
  let revenuePaise = 0;
  let revenueCount = 0;
  let prevRevenuePaise = 0;
  for (const row of rows.payments) {
    if (!isSuccessful(row)) continue;
    if (inWindow(row.dateKey, window)) {
      revenuePaise += row.amountPaise;
      revenueCount += 1;
    } else if (prev && inWindow(row.dateKey, prev)) {
      prevRevenuePaise += row.amountPaise;
    }
  }

  let expensesPaise = 0;
  let expensesCount = 0;
  let prevExpensesPaise = 0;
  for (const row of rows.expenses) {
    if (inWindow(row.dateKey, window)) {
      expensesPaise += row.amountPaise;
      expensesCount += 1;
    } else if (prev && inWindow(row.dateKey, prev)) {
      prevExpensesPaise += row.amountPaise;
    }
  }

  let outstandingPaise = 0;
  let outstandingCount = 0;
  const activeMemberIds = new Set<string>();
  const expiredMemberIds = new Set<string>();
  for (const row of rows.subscriptions) {
    if (row.balancePaise > 0) {
      outstandingPaise += row.balancePaise;
      outstandingCount += 1;
    }
    if (row.status === "Active" || row.status === "Expiring") {
      activeMemberIds.add(row.memberId);
    } else if (row.status === "Expired") {
      expiredMemberIds.add(row.memberId);
    }
  }

  let newMembers = 0;
  let prevNewMembers = 0;
  for (const member of rows.members) {
    const key = memberJoinKey(member);
    if (!key) continue;
    if (inWindow(key, window)) newMembers += 1;
    else if (prev && inWindow(key, prev)) prevNewMembers += 1;
  }

  const netPaise = revenuePaise - expensesPaise;
  const prevNetPaise = prevRevenuePaise - prevExpensesPaise;

  return {
    revenuePaise,
    revenueCount,
    revenueDelta: prev ? pctChange(revenuePaise, prevRevenuePaise) : null,
    outstandingPaise,
    outstandingCount,
    expensesPaise,
    expensesCount,
    expensesDelta: prev ? pctChange(expensesPaise, prevExpensesPaise) : null,
    netPaise,
    netDelta: prev ? pctChange(netPaise, prevNetPaise) : null,
    activeMembers: activeMemberIds.size,
    newMembers,
    newMembersDelta: prev ? pctChange(newMembers, prevNewMembers) : null,
    expiredMembers: expiredMemberIds.size,
  };
}

/* -- Membership report ---------------------------------------------------- */

export type PlanMixSlice = {
  plan: string;
  count: number;
  /** Share of active/expiring subscriptions, 0–100. */
  share: number;
};

export type MembershipReport = {
  /** Current-snapshot status counts (all subscriptions on record). */
  active: number;
  expiring: number;
  expired: number;
  frozen: number;
  cancelled: number;
  inactive: number;
  /** Memberships whose term started inside the window. */
  startedInRange: number;
  /**
   * Started inside the window for a member who already held an earlier
   * membership — the report's working definition of a renewal.
   */
  renewedInRange: number;
  /** Plan mix across currently Active/Expiring subscriptions. */
  planMix: PlanMixSlice[];
};

export function summarizeMemberships(
  rows: ReportRows,
  window: DateWindow,
): MembershipReport {
  let active = 0;
  let expiring = 0;
  let expired = 0;
  let frozen = 0;
  let cancelled = 0;
  let inactive = 0;
  for (const row of rows.subscriptions) {
    switch (row.status) {
      case "Active":
        active += 1;
        break;
      case "Expiring":
        expiring += 1;
        break;
      case "Expired":
        expired += 1;
        break;
      case "Frozen":
        frozen += 1;
        break;
      case "Cancelled":
        cancelled += 1;
        break;
      default:
        inactive += 1;
        break;
    }
  }

  // Earliest term start per member, to recognise renewals honestly.
  const earliestStart = new Map<string, number>();
  for (const row of rows.subscriptions) {
    const time = new Date(row.startDate).getTime();
    if (Number.isNaN(time)) continue;
    const current = earliestStart.get(row.memberId);
    if (current === undefined || time < current) {
      earliestStart.set(row.memberId, time);
    }
  }

  let startedInRange = 0;
  let renewedInRange = 0;
  for (const row of rows.subscriptions) {
    const time = new Date(row.startDate).getTime();
    if (Number.isNaN(time)) continue;
    if (!inWindow(toDateKey(new Date(time)), window)) continue;
    startedInRange += 1;
    if ((earliestStart.get(row.memberId) ?? time) < time) {
      renewedInRange += 1;
    }
  }

  const mix = new Map<string, number>();
  let mixTotal = 0;
  for (const row of rows.subscriptions) {
    if (row.status !== "Active" && row.status !== "Expiring") continue;
    mixTotal += 1;
    mix.set(row.planName, (mix.get(row.planName) ?? 0) + 1);
  }
  const planMix: PlanMixSlice[] = [...mix.entries()]
    .map(([plan, count]) => ({
      plan,
      count,
      share: mixTotal > 0 ? (count / mixTotal) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    active,
    expiring,
    expired,
    frozen,
    cancelled,
    inactive,
    startedInRange,
    renewedInRange,
    planMix,
  };
}

/* -- Expense payment-mode breakdown --------------------------------------- */

export type ExpenseModeSlice = {
  mode: string;
  count: number;
  totalPaise: number;
  share: number;
};

/**
 * Groups expenses by the stored `paymentMode`. Returns `[]` when no record
 * carries one, so callers can hide the section instead of guessing.
 */
export function expenseModeBreakdown(rows: ExpenseRow[]): ExpenseModeSlice[] {
  const map = new Map<string, ExpenseModeSlice>();
  let total = 0;
  for (const row of rows) {
    const mode = row.raw.paymentMode?.trim();
    if (!mode) continue;
    total += row.amountPaise;
    const existing = map.get(mode);
    if (existing) {
      existing.count += 1;
      existing.totalPaise += row.amountPaise;
    } else {
      map.set(mode, { mode, count: 1, totalPaise: row.amountPaise, share: 0 });
    }
  }
  const slices = [...map.values()].sort((a, b) => b.totalPaise - a.totalPaise);
  for (const slice of slices) {
    slice.share = total > 0 ? (slice.totalPaise / total) * 100 : 0;
  }
  return slices;
}

/* -- Misc ----------------------------------------------------------------- */

/** Today's date key; anchoring ranges to "now" keeps presets deterministic. */
export function reportAnchor(): string {
  return todayKey();
}

/** Ranged successful payments mapped to chart buckets. */
export function paymentAmounts(
  payments: PaymentRow[],
  window: DateWindow,
): { dateKey: string; amountPaise: number }[] {
  const out: { dateKey: string; amountPaise: number }[] = [];
  for (const row of payments) {
    if (!isSuccessful(row)) continue;
    if (!inWindow(row.dateKey, window)) continue;
    out.push({ dateKey: row.dateKey, amountPaise: row.amountPaise });
  }
  return out;
}

export function addMonthsForAnchor(anchor: string, months: number): string {
  return addMonthsKey(anchor, months);
}
