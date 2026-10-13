"use client";

import { CalendarClock, Repeat, RefreshCcw } from "lucide-react";
import { upcomingExpirations } from "@/lib/data";
import { cn } from "@/lib/cn";
import { formatShortDate } from "@/lib/format";
import { Avatar } from "./ui/Avatar";
import { Badge, type BadgeTone } from "./ui/Badge";
import { DashboardCard } from "./DashboardCard";

function toneFor(daysLeft: number): BadgeTone {
  if (daysLeft <= 3) return "danger";
  if (daysLeft <= 7) return "warning";
  return "gold";
}

function barColorFor(daysLeft: number): string {
  if (daysLeft <= 3) return "bg-danger";
  if (daysLeft <= 7) return "bg-warning";
  return "bg-gold";
}

export function UpcomingExpirations() {
  return (
    <DashboardCard
      title="Upcoming Expirations"
      subtitle="Memberships ending in the next 30 days"
      icon={CalendarClock}
      delay={0}
      menuItems={[
        { label: "Renew all due", icon: RefreshCcw },
        { label: "View schedule", icon: CalendarClock },
      ]}
      bodyClassName="pt-4"
    >
      <ul className="divide-y divide-line/60">
        {upcomingExpirations.map((entry, index) => (
          <li key={entry.id} className="group py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <Avatar initials={entry.initials} index={index} className="size-9 text-[10px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">
                  {entry.member}
                </p>
                <p className="mt-0.5 truncate text-xs text-faint">
                  {entry.plan} · ends {formatShortDate(entry.expiresOn)}
                </p>
              </div>
              <Badge tone={toneFor(entry.daysLeft)} className="shrink-0">
                {entry.daysLeft} {entry.daysLeft === 1 ? "day" : "days"}
              </Badge>
              <button
                type="button"
                title={`Renew ${entry.member}'s membership`}
                aria-label={`Renew ${entry.member}'s membership`}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-card-hover hover:text-gold"
              >
                <Repeat className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
            </div>

            <div className="mt-2.5 flex items-center gap-2.5 pl-12">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-soft">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500",
                    barColorFor(entry.daysLeft),
                  )}
                  style={{ width: `${entry.elapsed}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-[11px] tabular-nums text-faint">
                {entry.elapsed}% used
              </span>
            </div>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}