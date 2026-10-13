"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  BadgeX,
  CircleDollarSign,
  Receipt,
  RefreshCcw,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Kpi, KpiIcon } from "@/lib/data";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";
import { DashboardCard } from "./DashboardCard";
import { MiniSparkline } from "./charts/MiniSparkline";

const iconMap: Record<KpiIcon, LucideIcon> = {
  members: Users,
  active: BadgeCheck,
  expired: BadgeX,
  revenue: CircleDollarSign,
  pending: Receipt,
};

export function StatCard({ kpi, index }: { kpi: Kpi; index: number }) {
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
      </div>
    </DashboardCard>
  );
}