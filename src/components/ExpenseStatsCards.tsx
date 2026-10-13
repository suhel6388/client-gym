"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  PiggyBank,
  ReceiptText,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrencyInr, formatNumber, formatPercent } from "@/lib/format";
import { formatMonthLabel, todayKey } from "@/lib/date-window";
import { paiseToAmount } from "@/lib/members-api";
import type { ExpensesSummary } from "@/lib/expenses-view";

type StatTone = "gold" | "success" | "warning" | "neutral";

const TONE_CLASSES: Record<StatTone, string> = {
  gold: "bg-gold/12 text-gold ring-gold/20",
  success: "bg-success/12 text-success ring-success/20",
  warning: "bg-warning/12 text-warning ring-warning/20",
  neutral: "bg-card-hover text-subtle ring-line",
};

export type PeriodComparison = {
  previousPaise: number;
  /** Percentage change vs. the previous period, or `null` when incomparable. */
  deltaPct: number | null;
};

type ExpenseStatsCardsProps = {
  summary: ExpensesSummary;
  comparison: PeriodComparison | null;
  loading?: boolean;
  periodLabel: string;
};

export function ExpenseStatsCards({
  summary,
  comparison,
  loading = false,
  periodLabel,
}: ExpenseStatsCardsProps) {
  const cards: {
    label: string;
    value: string;
    footer: React.ReactNode;
    icon: LucideIcon;
    tone: StatTone;
  }[] = [
    {
      label: "Total Expenses",
      value: formatCurrencyInr(paiseToAmount(summary.totalPaise)),
      footer: (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-faint">
            {formatNumber(summary.count)} record{summary.count === 1 ? "" : "s"} ·{" "}
            {periodLabel}
          </span>
          {comparison && <TrendPill comparison={comparison} />}
        </div>
      ),
      icon: Coins,
      tone: "gold",
    },
    {
      label: "This Month",
      value: formatCurrencyInr(paiseToAmount(summary.monthPaise)),
      footer: (
        <span className="text-xs text-faint">
          {formatNumber(summary.monthCount)} record
          {summary.monthCount === 1 ? "" : "s"} in {formatMonthLabel(todayKey())}
        </span>
      ),
      icon: PiggyBank,
      tone: "neutral",
    },
    {
      label: "Highest Expense",
      value: formatCurrencyInr(paiseToAmount(summary.highestPaise)),
      footer: (
        <span className="block truncate text-xs text-faint" title={summary.highest?.title}>
          {summary.highest ? summary.highest.title : "No expenses in this period"}
        </span>
      ),
      icon: TrendingUp,
      tone: "warning",
    },
    {
      label: "Expense Transactions",
      value: formatNumber(summary.count),
      footer: <span className="text-xs text-faint">{periodLabel}</span>,
      icon: ReceiptText,
      tone: "neutral",
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 lg:mt-8">
      {cards.map((card, index) => (
        <StatTile key={card.label} card={card} delay={index * 60} loading={loading} />
      ))}
    </div>
  );
}

function TrendPill({ comparison }: { comparison: PeriodComparison }) {
  const { deltaPct } = comparison;
  if (deltaPct === null || !Number.isFinite(deltaPct)) {
    return <span className="text-[11px] text-faint">No previous data</span>;
  }
  if (Math.abs(deltaPct) < 0.05) {
    return <span className="text-[11px] text-faint">No change vs. previous</span>;
  }

  // Rising expenses are flagged amber; a drop is a positive signal.
  const up = deltaPct > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        up
          ? "bg-warning/12 text-warning ring-warning/25"
          : "bg-success/12 text-success ring-success/25",
      )}
    >
      <Icon className="size-3" strokeWidth={2} aria-hidden />
      {formatPercent(deltaPct)}
      <span className="text-faint">vs prev.</span>
    </span>
  );
}

function StatTile({
  card,
  delay,
  loading,
}: {
  card: {
    label: string;
    value: string;
    footer: React.ReactNode;
    icon: LucideIcon;
    tone: StatTone;
  };
  delay: number;
  loading: boolean;
}) {
  const Icon = card.icon;
  return (
    <section
      style={{ animationDelay: `${delay}ms` }}
      className="animate-fade-up flex flex-col rounded-card border border-line bg-card p-5 shadow-card transition-colors duration-200 hover:border-line-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-faint">{card.label}</p>
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
            TONE_CLASSES[card.tone],
          )}
        >
          <Icon className="size-4.5" strokeWidth={1.75} aria-hidden />
        </span>
      </div>

      {loading ? (
        <>
          <div className="mt-4 h-7 w-28 animate-pulse rounded-md bg-card-hover/60" />
          <div className="mt-3 h-3 w-32 animate-pulse rounded-md bg-card-hover/50" />
        </>
      ) : (
        <>
          <p className="mt-4 text-[26px] leading-none font-bold tracking-tight text-ink tabular-nums">
            {card.value}
          </p>
          <div className="mt-2.5 min-h-[18px]">{card.footer}</div>
        </>
      )}
    </section>
  );
}
