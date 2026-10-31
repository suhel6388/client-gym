"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  ChevronRight,
  IndianRupee,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  SUPER_ADMIN_PATH,
  fetchPlatformStats,
  type PlatformStats,
} from "@/lib/api";
import { formatNumber } from "@/lib/format";
import {
  auditActionLabel,
  auditActionTone,
  formatPaise,
  formatPlatformDate,
  formatRelativeTime,
  platformStatusMeta,
} from "@/lib/super-admin-view";
import { ScheduleCallsSection } from "./ScheduleCallsSection";
import { CreateGymOwnerDialog } from "./CreateGymOwnerDialog";

const GYMS_PATH = `${SUPER_ADMIN_PATH}/gyms`;

type StatTile = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: "gold" | "success" | "danger" | "warning";
};

function buildTiles(stats: PlatformStats): StatTile[] {
  return [
    {
      label: "Total gyms",
      value: formatNumber(stats.totalGyms),
      hint: `${formatNumber(stats.noSubscriptionGyms)} without a billing record`,
      icon: Building2,
      tone: "gold",
    },
    {
      label: "Active subscriptions",
      value: formatNumber(stats.activeSubscriptions),
      hint: `${formatNumber(stats.pastDueGyms)} past due · ${formatNumber(stats.suspendedGyms)} suspended`,
      icon: BadgeCheck,
      tone: "success",
    },
    {
      label: "Trial gyms",
      value: formatNumber(stats.trialGyms),
      hint: "Free trials currently running",
      icon: CalendarClock,
      tone: "warning",
    },
    {
      label: "Expired subscriptions",
      value: formatNumber(stats.expiredSubscriptions),
      hint: "Need renewal or reactivation",
      icon: TriangleAlert,
      tone: "danger",
    },
    {
      label: "Subscription revenue",
      value: formatPaise(stats.subscriptionRevenuePaise),
      hint: `${formatPaise(stats.monthlyRevenuePaise)} this month · ${formatNumber(
        stats.successfulPayments,
      )} payments`,
      icon: IndianRupee,
      tone: "gold",
    },
  ];
}

const toneClasses: Record<StatTile["tone"], string> = {
  gold: "bg-gold/12 text-gold ring-gold/20",
  success: "bg-success/12 text-success ring-success/20",
  danger: "bg-danger/12 text-danger ring-danger/20",
  warning: "bg-warning/12 text-warning ring-warning/20",
};

const SKELETON_TILE: StatTile = {
  label: "Loading",
  value: "",
  hint: "",
  icon: Wallet,
  tone: "gold",
};

function StatCard({
  tile,
  index,
  loading,
}: {
  tile: StatTile;
  index: number;
  loading: boolean;
}) {
  const Icon = tile.icon;
  return (
    <div
      className="animate-fade-up rounded-2xl border border-line bg-card/70 p-4 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] sm:p-5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium text-subtle">{tile.label}</p>
        <span
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
            toneClasses[tile.tone],
          )}
        >
          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-28 animate-pulse rounded-md bg-card-hover" />
      ) : (
        <p className="mt-2.5 text-[26px] font-bold leading-none tracking-tight text-ink">
          {tile.value}
        </p>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-faint">{tile.hint}</p>
    </div>
  );
}

export function PlatformDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);

    fetchPlatformStats(controller.signal)
      .then((result) => {
        if (!active) return;
        setStats(result);
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "Couldn't load platform statistics.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  const tiles = useMemo(() => (stats ? buildTiles(stats) : []), [stats]);
  const planTotal = useMemo(
    () => (stats?.planDistribution ?? []).reduce((sum, plan) => sum + plan.count, 0),
    [stats],
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <Sparkles className="size-4.5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
                Platform overview
              </h1>
              <p className="mt-1 text-sm text-subtle">
                Every gym, subscription and rupee collected across the SaaS.
              </p>
            </div>
          </div>
          {stats && (
            <p className="mt-3 text-[11px] text-faint">
              Live database snapshot · {formatRelativeTime(stats.generatedAt)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="md" onClick={load} disabled={loading}>
            <RefreshCw
              className={cn("size-4", loading && "animate-spin")}
              strokeWidth={2}
              aria-hidden
            />
            Refresh
          </Button>
          <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
            <UserPlus className="size-4" strokeWidth={2} aria-hidden />
            Create gym owner
          </Button>
          <Link
            href={GYMS_PATH}
            className="inline-flex h-9.5 items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-4 text-sm font-medium text-gold transition-colors hover:bg-gold/15"
          >
            All gyms
            <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex flex-col items-start gap-3 rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.75} aria-hidden />
            <div>
              <p className="text-[13px] font-semibold text-ink">
                Couldn&apos;t load platform statistics
              </p>
              <p className="mt-0.5 text-[12px] text-subtle">{error}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={load}>
            Try again
          </Button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => {
          const tile = tiles[index];
          return tile ? (
            <StatCard key={tile.label} tile={tile} index={index} loading={false} />
          ) : (
            <StatCard
              key={`skeleton-${index}`}
              tile={SKELETON_TILE}
              index={index}
              loading
            />
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-line bg-card/60 xl:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-line/60 px-5 py-4">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">Expiring within 7 days</h2>
              <p className="mt-0.5 text-[11.5px] text-faint">
                Paid periods and trials that need a renewal conversation.
              </p>
            </div>
            <Badge tone="warning">
              {stats ? formatNumber(stats.expiringSoon.length) : "—"}
            </Badge>
          </div>
          <div className="divide-y divide-line/40">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="h-9 flex-1 animate-pulse rounded-md bg-card-hover" />
                </div>
              ))
            ) : stats && stats.expiringSoon.length > 0 ? (
              stats.expiringSoon.map((item) => {
                const meta = platformStatusMeta(item.effectiveStatus);
                return (
                  <Link
                    key={item.gymId}
                    href={`${GYMS_PATH}/details?gymId=${encodeURIComponent(item.gymId)}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-card-hover/40"
                  >
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning ring-1 ring-inset ring-warning/20">
                      <CalendarClock className="size-4" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {item.gymName}
                      </p>
                      <p className="truncate text-[11px] text-faint">
                        {item.planName} · {formatPlatformDate(item.expiresAt)}
                      </p>
                    </div>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <span className="hidden text-[11px] tabular-nums text-subtle sm:block">
                      {item.remainingDays === 0
                        ? "today"
                        : `${item.remainingDays}d left`}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-faint" strokeWidth={1.75} aria-hidden />
                  </Link>
                );
              })
            ) : (
              <p className="px-5 py-10 text-center text-sm text-subtle">
                Nothing expires in the next week.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-card/60">
          <div className="border-b border-line/60 px-5 py-4">
            <h2 className="text-[14px] font-semibold text-ink">Plan mix</h2>
            <p className="mt-0.5 text-[11.5px] text-faint">
              Gym subscriptions by plan.
            </p>
          </div>
          <div className="space-y-4 px-5 py-5">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-8 animate-pulse rounded-md bg-card-hover" />
              ))
            ) : stats && stats.planDistribution.length > 0 ? (
              stats.planDistribution.map((plan) => {
                const percent = planTotal > 0 ? (plan.count / planTotal) * 100 : 0;
                return (
                  <div key={`${plan.planId ?? "none"}-${plan.planName}`}>
                    <div className="flex items-center justify-between gap-3 text-[12px]">
                      <span className="truncate text-subtle">{plan.planName}</span>
                      <span className="shrink-0 tabular-nums text-ink">{plan.count}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-soft to-gold"
                        style={{ width: `${Math.max(percent, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-sm text-subtle">
                No active subscriptions yet.
              </p>
            )}
          </div>
          <div className="border-t border-line/60 px-5 py-3.5">
            <p className="text-[11px] leading-relaxed text-faint">
              Revenue counts successful subscription payments only — trial gyms
              contribute ₹0.
            </p>
          </div>
        </section>
      </div>

      <ScheduleCallsSection />

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-line bg-card/60 xl:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-line/60 px-5 py-4">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">Newest gyms</h2>
              <p className="mt-0.5 text-[11.5px] text-faint">
                Most recent tenants and their billing state.
              </p>
            </div>
            <Link
              href={GYMS_PATH}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-gold hover:text-gold-bright"
            >
              View all
              <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden />
            </Link>
          </div>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[620px] divide-y divide-line/50">
              <thead>
                <tr className="bg-card-hover/30">
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Gym
                  </th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Owner
                  </th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Status
                  </th>
                  <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Plan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={4} className="px-5 py-3">
                        <div className="h-8 animate-pulse rounded-md bg-card-hover" />
                      </td>
                    </tr>
                  ))
                ) : stats && stats.recentGyms.length > 0 ? (
                  stats.recentGyms.map((gym) => {
                    const meta = platformStatusMeta(gym.effectiveStatus);
                    return (
                      <tr key={gym.id} className="transition-colors hover:bg-card-hover/40">
                        <td className="px-5 py-3">
                          <Link
                            href={`${GYMS_PATH}/details?gymId=${encodeURIComponent(gym.id)}`}
                            className="block min-w-0"
                          >
                            <p className="truncate text-[13px] font-medium text-ink hover:text-gold">
                              {gym.name}
                            </p>
                            <p className="truncate font-mono text-[10px] text-faint">
                              {gym.id}
                            </p>
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <p className="truncate text-[12px] text-subtle">
                            {gym.owner?.name ?? "No owner"}
                          </p>
                          <p className="truncate text-[10.5px] text-faint">
                            {gym.owner?.email ?? "—"}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={meta.tone} dot>
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right text-[12px] text-subtle">
                          {gym.subscription?.plan?.name ??
                            gym.subscription?.planNameSnapshot ??
                            "No plan"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-subtle">
                      No gyms registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet: one card per gym, no sideways scroll */}
          <ul className="divide-y divide-line/40 lg:hidden">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <li key={`gym-skeleton-${index}`} className="px-4 py-3">
                  <div className="h-12 animate-pulse rounded-md bg-card-hover" />
                </li>
              ))
            ) : stats && stats.recentGyms.length > 0 ? (
              stats.recentGyms.map((gym) => {
                const meta = platformStatusMeta(gym.effectiveStatus);
                return (
                  <li key={gym.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`${GYMS_PATH}/details?gymId=${encodeURIComponent(gym.id)}`}
                        className="min-w-0 flex-1"
                      >
                        <p className="truncate text-[13px] font-medium text-ink hover:text-gold">
                          {gym.name}
                        </p>
                        <p className="truncate font-mono text-[10px] text-faint">{gym.id}</p>
                      </Link>
                      <Badge tone={meta.tone} dot>
                        {meta.label}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[11.5px]">
                      <span className="min-w-0 truncate text-faint">
                        {gym.owner?.name ?? "No owner"}
                        {gym.owner?.email ? ` · ${gym.owner.email}` : ""}
                      </span>
                      <span className="shrink-0 text-subtle">
                        {gym.subscription?.plan?.name ??
                          gym.subscription?.planNameSnapshot ??
                          "No plan"}
                      </span>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-10 text-center text-sm text-subtle">
                No gyms registered yet.
              </li>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-card/60">
          <div className="flex items-center justify-between gap-3 border-b border-line/60 px-5 py-4">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">Recent admin activity</h2>
              <p className="mt-0.5 text-[11.5px] text-faint">Audited platform actions.</p>
            </div>
            <Link
              href={`${SUPER_ADMIN_PATH}/activity`}
              className="text-[12px] font-medium text-gold hover:text-gold-bright"
            >
              All
            </Link>
          </div>
          <ul className="divide-y divide-line/40">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <li key={index} className="px-5 py-3">
                  <div className="h-7 animate-pulse rounded-md bg-card-hover" />
                </li>
              ))
            ) : stats && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((log) => (
                <li key={log.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={auditActionTone(log.action)}>
                      {auditActionLabel(log.action)}
                    </Badge>
                    <span className="shrink-0 text-[10.5px] text-faint">
                      {formatRelativeTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-[11.5px] text-subtle">
                    {log.reason || "No reason recorded"}
                  </p>
                  <p className="truncate text-[10.5px] text-faint">
                    {log.actorEmail ?? "System"}
                  </p>
                </li>
              ))
            ) : (
              <li className="px-5 py-10 text-center text-sm text-subtle">
                No admin actions yet.
              </li>
            )}
          </ul>
        </section>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line/60 bg-panel/40 px-4 py-3 text-[11px] text-faint">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" strokeWidth={1.75} aria-hidden />
          Tenant isolation is enforced on every gym route.
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldAlert className="size-3.5" strokeWidth={1.75} aria-hidden />
          Only SUPER_ADMIN sessions can query across gyms.
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Wallet className="size-3.5" strokeWidth={1.75} aria-hidden />
          Revenue is derived from successful payments.
        </span>
      </div>

      <CreateGymOwnerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => load()}
      />
    </div>
  );
}
