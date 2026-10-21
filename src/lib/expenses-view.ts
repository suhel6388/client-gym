import {
  addDaysKey,
  addMonthsKey,
  dayCount,
  diffDays,
  endOfMonthKey,
  endOfYearKey,
  formatDayLabel,
  formatMonthLabel,
  formatShortDayLabel,
  inMonth,
  inWindow,
  startOfMonthKey,
  startOfWeekKey,
  startOfYearKey,
  toDateKey,
  todayKey,
  type DateWindow,
} from "./date-window";
import type { ExpenseDto } from "./api";

/* -- Categories ----------------------------------------------------------- */

/**
 * The backend stores `category` as a free-form string with no predefined set
 * (see `expenseInput`). These are the UI suggestions from the product spec;
 * any value already stored on a record is also surfaced in the filters.
 */
export const EXPENSE_CATEGORIES = [
  "Rent",
  "Electricity",
  "Water",
  "Equipment",
  "Maintenance",
  "Staff Salary",
  "Cleaning",
  "Marketing",
  "Internet",
  "Supplies",
  "Other",
] as const;

/** On-theme palette (golds, bronzes, neutrals) for the category donut. */
export const CATEGORY_COLORS = [
  "#E8B84D",
  "#F6D477",
  "#B8862D",
  "#FFC857",
  "#C9A24B",
  "#8A6520",
  "#6B4E18",
  "#A1801F",
  "#4B4B52",
  "#3F3F46",
  "#71717A",
];

/* -- Period window -------------------------------------------------------- */

export type ExpensesPeriod = "today" | "week" | "month" | "year" | "custom";

export const EXPENSE_PERIODS: { value: ExpensesPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

export function expensesWindow(
  period: ExpensesPeriod,
  anchor: string,
  custom: { from: string; to: string },
): DateWindow {
  switch (period) {
    case "today":
      return { from: anchor, to: anchor };
    case "week": {
      const from = startOfWeekKey(anchor);
      return { from, to: addDaysKey(from, 6) };
    }
    case "year":
      return { from: startOfYearKey(anchor), to: endOfYearKey(anchor) };
    case "custom": {
      const from = custom.from <= custom.to ? custom.from : custom.to;
      const to = custom.from <= custom.to ? custom.to : custom.from;
      return { from, to };
    }
    case "month":
    default:
      return { from: startOfMonthKey(anchor), to: endOfMonthKey(anchor) };
  }
}

/** The period immediately before the selected one, for comparisons. */
export function previousWindow(
  period: ExpensesPeriod,
  anchor: string,
  custom: { from: string; to: string },
): DateWindow | null {
  switch (period) {
    case "today": {
      const day = addDaysKey(anchor, -1);
      return { from: day, to: day };
    }
    case "week": {
      const from = addDaysKey(startOfWeekKey(anchor), -7);
      return { from, to: addDaysKey(from, 6) };
    }
    case "month": {
      const prev = addMonthsKey(startOfMonthKey(anchor), -1);
      return { from: startOfMonthKey(prev), to: endOfMonthKey(prev) };
    }
    case "year": {
      const prev = addMonthsKey(startOfYearKey(anchor), -12);
      return { from: startOfYearKey(prev), to: endOfYearKey(prev) };
    }
    case "custom": {
      const current = expensesWindow(period, anchor, custom);
      const length = dayCount(current);
      if (!current.from || !length) return null;
      return { from: addDaysKey(current.from, -length), to: addDaysKey(current.from, -1) };
    }
    default:
      return null;
  }
}

export function windowLabel(window: DateWindow): string {
  if (window.from && window.to) {
    if (window.from === window.to) return formatDayLabel(window.from);
    return `${formatDayLabel(window.from)} – ${formatDayLabel(window.to)}`;
  }
  if (window.from) return `From ${formatDayLabel(window.from)}`;
  return window.to ? `Until ${formatDayLabel(window.to)}` : "All time";
}

/* -- Row model ------------------------------------------------------------ */

export type ExpenseRow = {
  id: number;
  title: string;
  category: string;
  /** Amount in paise (minor units). */
  amountPaise: number;
  notes: string | null;
  /** Local calendar day (`YYYY-MM-DD`) of the expense date. */
  dateKey: string;
  expenseDate: string;
  createdAt: string;
  raw: ExpenseDto;
};

export function toExpenseRow(dto: ExpenseDto): ExpenseRow {
  const iso = dto.expenseDate || dto.createdAt;
  const notesRaw = dto.notes ?? dto.description ?? null;
  return {
    id: dto.id,
    title: dto.title?.trim() || dto.name?.trim() || "Untitled expense",
    category: dto.category?.trim() || "Other",
    amountPaise: Number.isFinite(dto.amountPaise) ? dto.amountPaise : 0,
    notes: notesRaw && notesRaw.trim() ? notesRaw.trim() : null,
    dateKey: toDateKey(new Date(iso)),
    expenseDate: iso,
    createdAt: dto.createdAt,
    raw: dto,
  };
}

export function toExpenseRows(list: ExpenseDto[]): ExpenseRow[] {
  return list.map(toExpenseRow);
}

/* -- Aggregation ---------------------------------------------------------- */

export type ExpensesSummary = {
  /** Total for the selected period. */
  totalPaise: number;
  /** Records in the selected period. */
  count: number;
  /** Total for the current calendar month (independent of the period). */
  monthPaise: number;
  monthCount: number;
  /** Largest single expense in the selected period. */
  highestPaise: number;
  highest: ExpenseRow | null;
};

export function summarizeExpenses(
  rows: ExpenseRow[],
  window: DateWindow,
  today: string = todayKey(),
): ExpensesSummary {
  let totalPaise = 0;
  let count = 0;
  let highestPaise = 0;
  let highest: ExpenseRow | null = null;
  let monthPaise = 0;
  let monthCount = 0;

  for (const row of rows) {
    if (inWindow(row.dateKey, window)) {
      totalPaise += row.amountPaise;
      count += 1;
      if (row.amountPaise > highestPaise) {
        highestPaise = row.amountPaise;
        highest = row;
      }
    }
    if (inMonth(row.dateKey, today)) {
      monthPaise += row.amountPaise;
      monthCount += 1;
    }
  }

  return {
    totalPaise,
    count,
    monthPaise,
    monthCount,
    highestPaise,
    highest,
  };
}

export function totalInWindow(rows: ExpenseRow[], window: DateWindow): number {
  let total = 0;
  for (const row of rows) {
    if (inWindow(row.dateKey, window)) total += row.amountPaise;
  }
  return total;
}

export type CategorySlice = {
  category: string;
  totalPaise: number;
  count: number;
  /** Percentage share of the total, 0–100. */
  share: number;
};

export function categoryBreakdown(rows: ExpenseRow[]): CategorySlice[] {
  const map = new Map<string, CategorySlice>();
  let total = 0;

  for (const row of rows) {
    total += row.amountPaise;
    const existing = map.get(row.category);
    if (existing) {
      existing.totalPaise += row.amountPaise;
      existing.count += 1;
    } else {
      map.set(row.category, {
        category: row.category,
        totalPaise: row.amountPaise,
        count: 1,
        share: 0,
      });
    }
  }

  const slices = [...map.values()].sort((a, b) => b.totalPaise - a.totalPaise);
  for (const slice of slices) {
    slice.share = total > 0 ? (slice.totalPaise / total) * 100 : 0;
  }
  return slices;
}

/* -- Trend series --------------------------------------------------------- */

export type TrendGranularity = "day" | "week" | "month";

export type TrendPoint = {
  /** Bucket start date key. */
  key: string;
  label: string;
  totalPaise: number;
  count: number;
};

function minKey(rows: { dateKey: string }[]): string | null {
  if (rows.length === 0) return null;
  return rows.reduce((min, row) => (row.dateKey < min ? row.dateKey : min), rows[0].dateKey);
}

function maxKey(rows: { dateKey: string }[]): string | null {
  if (rows.length === 0) return null;
  return rows.reduce((max, row) => (row.dateKey > max ? row.dateKey : max), rows[0].dateKey);
}

/**
 * Buckets dated amounts for the chart: daily for short windows, weekly for
 * medium windows and monthly for long windows (so the axis never crowds).
 * Accepts any `{ dateKey, amountPaise }` rows, so revenue and expenses share
 * the implementation.
 */
export function buildTrendSeries(
  rows: { dateKey: string; amountPaise: number }[],
  window: DateWindow,
  today: string = todayKey(),
): { points: TrendPoint[]; granularity: TrendGranularity } {
  const from = window.from ?? minKey(rows) ?? today;
  const to = window.to ?? maxKey(rows) ?? today;
  const span = diffDays(from, to);

  const granularity: TrendGranularity =
    span <= 31 ? "day" : span <= 120 ? "week" : "month";

  const points: TrendPoint[] = [];
  const index = new Map<string, TrendPoint>();

  const firstBucket =
    granularity === "week"
      ? startOfWeekKey(from)
      : granularity === "month"
        ? startOfMonthKey(from)
        : from;

  let cursor = firstBucket;
  let guard = 0;
  while (cursor <= to && guard < 400) {
    const point: TrendPoint = {
      key: cursor,
      label: granularity === "month" ? formatMonthLabel(cursor) : formatShortDayLabel(cursor),
      totalPaise: 0,
      count: 0,
    };
    points.push(point);
    index.set(cursor, point);
    cursor =
      granularity === "day"
        ? addDaysKey(cursor, 1)
        : granularity === "week"
          ? addDaysKey(cursor, 7)
          : addMonthsKey(cursor, 1);
    guard += 1;
  }

  for (const row of rows) {
    if (!inWindow(row.dateKey, window)) continue;
    const bucket =
      granularity === "day"
        ? row.dateKey
        : granularity === "week"
          ? startOfWeekKey(row.dateKey)
          : startOfMonthKey(row.dateKey);
    const point = index.get(bucket);
    if (point) {
      point.totalPaise += row.amountPaise;
      point.count += 1;
    }
  }

  return { points, granularity };
}
