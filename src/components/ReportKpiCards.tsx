"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  CircleAlert,
  IndianRupee,
  PiggyBank,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  formatCurrencyInr,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { paiseToAmount } from "@/lib/members-api";
import type { ReportKpis } from "@/lib/reports-view";

type StatTone = "gold" | "success" | "warning" | "danger" | "neutral";

const TONE_CLASSES: Record<StatTone, string> = {
  gold: "bg-gold/12 text-gold ring-gold/20",
  success: "bg-success/12 text-success ring-success/20",
  warning: "bg-warning/12 text-warning ring-warning/20",
  danger: "bg-danger/12 text-danger ring-danger/20",
  neutral: "bg-card-hover text-subtle ring-line",
};

type KpiDef = {
  key: string;
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: StatTone;
  /** Real previous-period comparison, or `null` when incomparable. */
  delta: number | null;
  /** When true, higher values are worse (expenses, outstanding, expired). */
  invertDelta?: boolean;
  noData?: boolean;
};

type ReportKpiCardsProps = {
  kpis: ReportKpis;
  loading?: boolean;
  periodLabel: string;
};

export function ReportKpiCards({ kpis, loading = false, periodLabel }: ReportKpiCardsProps) {
  const cards: KpiDef[] = [
    {
      key: "revenue",
      label: "Total Revenue",
      value: formatCurrencyInr(paiseToAmount(kpis.revenuePaise)),
      helper: `${formatNumber(kpis.revenueCount)} collections · ${periodLabel}`,
      icon: IndianRupee,
      tone: "gold",
      delta: kpis.revenueDelta,
    },
    {
      key: "outstanding",
      label: "Outstanding Fees",
      value: formatCurrencyInr(paiseToAmount(kpis.outstandingPaise)),
      helper: `${formatNumber(kpis.outstandingCount)} open balances · current`,
      icon: ReceiptText,
      tone: "warning",
      delta: null,
      invertDelta: true,
    },
    {
      key: "expenses",
      label: "Total Expenses",
      value: formatCurrencyInr(paiseToAmount(kpis.expensesPaise)),
      helper: `${formatNumber(kpis.expensesCount)} records · ${periodLabel}`,
      icon: PiggyBank,
      tone: "neutral",
      delta: kpis.expensesDelta,
      invertDelta: true,
    },
    {
      key: "net",
      label: "Net Income",
      value: formatCurrencyInr(paiseToAmount(kpis.netPaise)),
      helper: `Revenue minus expenses · ${periodLabel}`,
      icon: kpis.netPaise >= 0 ? TrendingUp : TrendingDown,
      tone: kpis.netPaise >= 0 ? "success" : "danger",
      delta: kpis.netDelta,
    },
    {
      key: "active",
      label: "Active Members",
      value: formatNumber(kpis.activeMembers),
      helper: "Holding an active subscription · current",
      icon: Users,
      tone: "success",
      delta: null,
    },
    {
      key: "new",
      label: "New Members",
      value: formatNumber(kpis.newMembers),
      helper: `Joined ${periodLabel.toLowerCase()}`,
      icon: UserPlus,
      tone: "gold",
      delta: kpis.newMembersDelta,
    },
    {
      key: "expired",
      label: "Expired Memberships",
      value: formatNumber(kpis.expiredMembers),
      helper: "Holding an expired subscription · current",
      icon: CircleAlert,
      tone: "danger",
      delta: null,
      invertDelta: true,
    },
    {
      key: "attendance",
      label: "Attendance Rate",
      value: "No data",
      helper: "Attendance tracking isn't connected yet",
      icon: CalendarCheck,
      tone: "neutral",
      delta: null,
      noData: true,
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 lg:mt-8">
      {cards.map((card, index) => (
        <KpiTile key={card.key} card={card} delay={index * 50} loading={loading} />
      ))}
    </div>
  );
}

function DeltaPill({ delta, invertDelta = false }: { delta: number; invertDelta?: boolean }) {
  if (!Number.isFinite(delta) || Math.abs(delta) < 0.05) {
    return <span className="text-[11px] text-faint">No change vs. previous</span>;
  }
  const up = delta > 0;
  // Rising revenue/members is good; rising expenses/outstanding/expired is bad.
  const good = invertDelta ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        good
          ? "bg-success/12 text-success ring-success/25"
          : "bg-danger/12 text-danger ring-danger/25",
      )}
    >
      <Icon className="size-3" strokeWidth={2} aria-hidden />
      {formatPercent(delta)}
      <span className="text-faint">vs prev.</span>
    </span>
  );
}

function KpiTile({
  card,
  delay,
  loading,
}: {
  card: KpiDef;
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
          <p
            className={cn(
              "mt-4 text-[26px] leading-none font-bold tracking-tight tabular-nums",
              card.noData ? "text-faint" : "text-ink",
            )}
          >
            {card.value}
          </p>
          <div className="mt-2.5 flex min-h-[18px] flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-xs text-faint">{card.helper}</span>
            {card.delta !== null && !card.noData && (
              <DeltaPill delta={card.delta} invertDelta={card.invertDelta} />
            )}
          </div>
        </>
      )}
    </section>
  );
}
