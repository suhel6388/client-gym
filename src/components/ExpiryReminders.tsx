"use client";

import { CalendarClock, CheckCircle2, Repeat } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatShortDate } from "@/lib/format";
import type { SubscriptionRow } from "@/lib/membership-view";
import { Avatar } from "./ui/Avatar";
import { Badge, type BadgeTone } from "./ui/Badge";
import { Button } from "./ui/Button";
import { DashboardCard } from "./DashboardCard";

/** Compact window (days) highlighted by the reminders widget. */
export const REMINDER_WINDOW_DAYS = 7;

type Group = {
  key: "today" | "week" | "expired";
  title: string;
  tone: BadgeTone;
  rows: SubscriptionRow[];
  daysLabel: (row: SubscriptionRow) => string;
};

type ExpiryRemindersProps = {
  rows: SubscriptionRow[];
  loading?: boolean;
  onRenew: (row: SubscriptionRow) => void;
  delay?: number;
};

export function ExpiryReminders({ rows, loading = false, onRenew, delay = 0 }: ExpiryRemindersProps) {
  const today = rows
    .filter((row) => row.status === "Expiring" && row.daysLeft <= 0)
    .sort((a, b) => a.endDate.localeCompare(b.endDate));
  const week = rows
    .filter((row) => row.status === "Expiring" && row.daysLeft > 0 && row.daysLeft <= REMINDER_WINDOW_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft);
  const expired = rows
    .filter((row) => row.status === "Expired")
    .sort((a, b) => b.endDate.localeCompare(a.endDate))
    .slice(0, 5);

  const allGroups: Group[] = [
    {
      key: "today",
      title: "Expiring today",
      tone: "danger",
      rows: today,
      daysLabel: () => "Due today",
    },
    {
      key: "week",
      title: `Next ${REMINDER_WINDOW_DAYS} days`,
      tone: "warning",
      rows: week,
      daysLabel: (row) => `${row.daysLeft}d left`,
    },
    {
      key: "expired",
      title: "Already expired",
      tone: "muted",
      rows: expired,
      daysLabel: (row) => `${Math.abs(row.daysLeft)}d ago`,
    },
  ];
  const groups = allGroups.filter((group) => group.rows.length > 0);

  const total = today.length + week.length + expired.length;

  return (
    <DashboardCard
      title="Expiry reminders"
      subtitle={
        total > 0
          ? `${today.length + week.length} due this week · ${expired.length} expired`
          : "Renewals and lapsed memberships"
      }
      icon={CalendarClock}
      delay={delay}
    >
      {loading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-card-hover/50" />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-success/10 text-success ring-1 ring-inset ring-success/20">
            <CheckCircle2 className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="mt-3 text-[13px] font-medium text-ink">All clear</p>
          <p className="mt-1 text-xs text-subtle">
            No memberships are expiring in the next {REMINDER_WINDOW_DAYS} days.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {groups.map((group) => (
            <div key={group.key}>
              <div className="flex items-center gap-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
                  {group.title}
                </h3>
                <Badge tone={group.tone}>{group.rows.length}</Badge>
              </div>
              <ul className="mt-2 space-y-1.5">
                {group.rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center gap-3 rounded-lg border border-line/60 bg-card-hover/20 px-3 py-2.5"
                  >
                    <Avatar
                      initials={row.memberInitials}
                      index={row.memberCode.charCodeAt(row.memberCode.length - 1) % 4}
                      className="size-8 text-[10px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{row.memberName}</p>
                      <p className="truncate text-[11px] text-faint">
                        {row.planName} · ends {formatShortDate(row.endDate.slice(0, 10))}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "hidden shrink-0 text-[11px] font-medium tabular-nums sm:block",
                        group.key === "expired" ? "text-faint" : "text-warning",
                      )}
                    >
                      {group.daysLabel(row)}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onRenew(row)}
                      aria-label={`Renew ${row.memberName}`}
                    >
                      <Repeat className="size-3.5" strokeWidth={1.75} aria-hidden />
                      Renew
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
