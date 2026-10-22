"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  IndianRupee,
  RefreshCcw,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { DashboardKpi, DashboardKpiIcon } from "@/lib/dashboard-view";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";
import { DashboardCard } from "./DashboardCard";
import { MiniSparkline } from "./charts/MiniSparkline";

const iconMap: Record<DashboardKpiIcon, LucideIcon> = {
  members: Users,
  active: BadgeCheck,
  expiring: CalendarClock,
  revenue: IndianRupee,
  collected: Wallet,
};

export function StatCard({
  kpi,
  index,
  loading = false,
}: {
  kpi: DashboardKpi;
  index: number;
  loading?: boolean;
}) {
  const Icon = iconMap[kpi.icon];
  const positive = kpi.trend.value >= 0;

  return (
    <DashboardCard
      title={kpi.label}
      icon={Icon}
      delay={index * 60}
      menuItems={[
        { label: "View details", icon: RefreshCcw },
        { label: "Export CSV" },
        { label: "Manage alerts" },
        { label: "Refresh", icon: RefreshCcw },
      ]}
      className="group"
    >
      <div className="mt-4 flex flex-col">
        {loading ? (
          <>
            <div className="h-7 w-28 animate-pulse rounded-md bg-card-hover/60" />
            <div className="mt-3 h-3 w-32 animate-pulse rounded-md bg-card-hover/50" />
            <div className="mt-auto pt-4">
              <div className="h-8 w-full animate-pulse rounded-md bg-card-hover/40" />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[28px] leading-none font-bold tracking-tight text-ink tabular-nums">
                {kpi.value}
              </p>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold tabular-nums ring-1 ring-inset",
                  kpi.trend.favorable
                    ? "bg-success/10 text-success ring-success/20"
                    : "bg-danger/10 text-danger ring-danger/20",
                )}
              >
                {positive ? (
                  <ArrowUpRight className="size-3" strokeWidth={2.25} aria-hidden />
                ) : (
                  <ArrowDownRight className="size-3" strokeWidth={2.25} aria-hidden />
                )}
                {formatPercent(kpi.trend.value)}
              </span>
            </div>

            <p className="mt-2 text-xs text-faint">{kpi.helper}</p>

            <div className="mt-auto pt-4">
              <MiniSparkline data={kpi.spark} />
            </div>
          </>
        )}
      </div>
    </DashboardCard>
  );
}