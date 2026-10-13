"use client";

import { DoorOpen, Percent, UserCheck, UserX } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

export type AttendanceStats = {
  /** Distinct members with a check-in on the focus date. */
  present: number;
  /** Expected members with no check-in on the focus date. */
  absent: number;
  /** Active members expected on the focus date. */
  expected: number;
  /** Present / expected, as a percentage. */
  rate: number;
  /** Members currently checked in without a checkout. */
  currentlyInside: number;
};

type StatDef = {
  label: string;
  value: string;
  helper: string;
  icon: typeof UserCheck;
  tone: "gold" | "success" | "warning" | "danger";
};

const TONE_CLASSES: Record<StatDef["tone"], string> = {
  gold: "bg-gold/12 text-gold ring-gold/20",
  success: "bg-success/12 text-success ring-success/20",
  warning: "bg-warning/12 text-warning ring-warning/20",
  danger: "bg-danger/12 text-danger ring-danger/20",
};

type AttendanceStatsCardsProps = {
  stats: AttendanceStats;
  loading?: boolean;
  dateLabel: string;
  periodLabel: string;
};

export function AttendanceStatsCards({
  stats,
  loading = false,
  dateLabel,
  periodLabel,
}: AttendanceStatsCardsProps) {
  const cards: StatDef[] = [
    {
      label: "Present Today",
      value: formatNumber(stats.present),
      helper: `${formatNumber(stats.expected)} expected ${dateLabel}`,
      icon: UserCheck,
      tone: "success",
    },
    {
      label: "Absent Today",
      value: formatNumber(stats.absent),
      helper: "Active members who haven't checked in",
      icon: UserX,
      tone: stats.absent > 0 ? "danger" : "gold",
    },
    {
      label: "Attendance Rate",
      value: `${stats.rate.toFixed(1)}%`,
      helper: `Of expected members · ${periodLabel.toLowerCase()}`,
      icon: Percent,
      tone: stats.rate >= 60 ? "success" : stats.rate >= 30 ? "warning" : "danger",
    },
    {
      label: "Currently Inside",
      value: formatNumber(stats.currentlyInside),
      helper: "Checked in without a checkout",
      icon: DoorOpen,
      tone: "gold",
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
          <div className="mt-4 h-7 w-20 animate-pulse rounded-md bg-card-hover/60" />
          <div className="mt-3 h-3 w-32 animate-pulse rounded-md bg-card-hover/50" />
        </>
      ) : (
        <>
          <p className="mt-4 text-[28px] leading-none font-bold tracking-tight text-ink tabular-nums">
            {card.value}
          </p>
          <p className="mt-2 text-xs text-faint">{card.helper}</p>
        </>
      )}
    </section>
  );
}
