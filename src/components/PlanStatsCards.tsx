"use client";

import {
  BadgeCheck,
  CircleDollarSign,
  Layers,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatNumber } from "@/lib/format";
import { paiseToAmount } from "@/lib/members-api";
import type { PlanPerformance } from "@/lib/plans-view";

type StatTone = "gold" | "success" | "neutral";

type StatDef = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: StatTone;
};

const TONE_CLASSES: Record<StatTone, string> = {
  gold: "bg-gold/12 text-gold ring-gold/20",
  success: "bg-success/12 text-success ring-success/20",
  neutral: "bg-card-hover text-subtle ring-line",
};

type PlanStatsCardsProps = {
  performance: PlanPerformance;
  loading?: boolean;
};

export function PlanStatsCards({ performance, loading = false }: PlanStatsCardsProps) {
  const cards: StatDef[] = [
    {
      label: "Total Plans",
      value: formatNumber(performance.totalPlans),
      helper: `${formatNumber(performance.activePlans)} active in catalog`,
      icon: Layers,
      tone: "gold",
    },
    {
      label: "Active Subscriptions",
      value: formatNumber(performance.activeSubscriptions),
      helper: "Members on billable plans",
      icon: BadgeCheck,
      tone: "success",
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(paiseToAmount(performance.mrrPaise)),
      helper: "Normalized from active terms",
      icon: CircleDollarSign,
      tone: "neutral",
    },
    {
      label: "Average Price",
      value: `${formatCurrency(paiseToAmount(performance.avgMonthlyPaise))}/mo`,
      helper: "Mean monthly equivalent",
      icon: TrendingUp,
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

function StatTile({
  card,
  delay,
  loading,
}: {
  card: StatDef;
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
          <div className="mt-4 h-7 w-24 animate-pulse rounded-md bg-card-hover/60" />
          <div className="mt-3 h-3 w-32 animate-pulse rounded-md bg-card-hover/50" />
        </>
      ) : (
        <>
          <p className="mt-4 text-[28px] leading-none font-bold tracking-tight text-ink tabular-nums">
            {card.value}
          </p>
          <p className="mt-2 truncate text-xs text-faint">{card.helper}</p>
        </>
      )}
    </section>
  );
}
