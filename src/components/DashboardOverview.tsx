"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiError, fetchDashboardReport, fetchMemberJoins } from "@/lib/api";
import { readDashboardCache, writeDashboardCache } from "@/lib/dashboard-cache";
import { buildDashboardView, type DashboardView } from "@/lib/dashboard-view";
import { formatCurrency, formatNumber } from "@/lib/format";
import { listMemberships, listPayments } from "@/lib/members-api";
import { useSession } from "./auth/SessionProvider";
import { DashboardAnalytics } from "./DashboardAnalytics";
import { DashboardToolbar } from "./DashboardToolbar";
import { RecentPaymentsTable } from "./RecentPaymentsTable";
import { StatCard } from "./StatCard";
import { TrialBanner } from "./TrialBanner";
import { Button } from "./ui/Button";

type LoadStatus = "loading" | "ready" | "error";

const KPI_PLACEHOLDERS = [
  { id: "total-members", label: "Total Members", icon: "members" as const },
  { id: "active-memberships", label: "Active Memberships", icon: "active" as const },
  { id: "expiring-memberships", label: "Expiring in 7 Days", icon: "expiring" as const },
  { id: "monthly-revenue", label: "Monthly Revenue", icon: "revenue" as const },
  { id: "collected-today", label: "Collected Today", icon: "collected" as const },
];

export function DashboardOverview() {
  const { user } = useSession();
  // Gym + account key: a cached view can never leak across accounts.
  const cacheKey = user ? `${user.gymId ?? "no-gym"}:${user.id}` : null;

  // Paint a recent snapshot immediately (returning to the dashboard, or the
  // redirect right after login). The live data still loads in the background.
  const [state, setState] = useState<{
    view: DashboardView | null;
    status: LoadStatus;
  }>(() => {
    const cached = readDashboardCache(cacheKey);
    return { view: cached, status: cached ? "ready" : "loading" };
  });
  const [error, setError] = useState<string | null>(null);
  const { view, status } = state;

  const load = useCallback(
    async (signal?: AbortSignal) => {
      const cached = readDashboardCache(cacheKey);
      setError(null);
      // With a cached view the shell stays "ready" and the fetch is a silent
      // refresh; only a first visit shows the KPI placeholders.
      setState((previous) => {
        if (cached) {
          return previous.view === cached && previous.status === "ready"
            ? previous
            : { view: cached, status: "ready" };
        }
        if (previous.view && previous.status === "ready") return previous;
        return previous.status === "loading"
          ? previous
          : { view: previous.view, status: "loading" };
      });

      try {
        const [report, payments, memberships, memberJoins] = await Promise.all([
          fetchDashboardReport(signal),
          listPayments(signal),
          listMemberships(undefined, signal),
          fetchMemberJoins(signal, { includePlan: true }),
        ]);
        if (signal?.aborted) return;
        const nextView = buildDashboardView({
          report,
          payments,
          memberships,
          members: memberJoins,
        });
        writeDashboardCache(cacheKey, nextView);
        setState({ view: nextView, status: "ready" });
      } catch (caught) {
        if (signal?.aborted) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Couldn't load the dashboard. Please try again.",
        );
        // A failed refresh keeps the last good view instead of blanking the
        // page; only a first load with no data shows the error state.
        setState((previous) =>
          previous.view
            ? { view: previous.view, status: "ready" }
            : { view: null, status: "error" },
        );
      }
    },
    [cacheKey],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const subtitle =
    view && status === "ready"
      ? `${formatCurrency(view.summary.monthlyRevenue)} collected this month · ${formatNumber(
          view.summary.activeMemberships,
        )} active memberships`
      : "A live view of your gym's members, revenue and renewals.";

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <TrialBanner className="mb-5" />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="animate-fade-up">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
            Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-subtle">
            Welcome back{firstName ? `, ${firstName}` : ""} — {subtitle}
          </p>
        </div>
        <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
          <DashboardToolbar />
        </div>
      </div>

      {status === "error" ? (
        <div
          role="alert"
          className="mt-6 flex flex-wrap items-center gap-3 rounded-card border border-danger/25 bg-danger/[0.06] px-4 py-3 lg:mt-8"
        >
          <AlertTriangle className="size-4 shrink-0 text-danger" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Couldn&apos;t load the dashboard</p>
            <p className="mt-0.5 text-xs text-subtle">{error}</p>
          </div>
          <Button variant="secondary" size="md" onClick={() => void load()}>
            <RefreshCw className="size-4" strokeWidth={1.75} aria-hidden />
            Retry
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:mt-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {view
              ? view.kpis.map((kpi, index) => (
                  <StatCard key={kpi.id} kpi={kpi} index={index} />
                ))
              : KPI_PLACEHOLDERS.map((kpi, index) => (
                  <StatCard
                    key={kpi.id}
                    kpi={{ ...kpi, value: "—", helper: "", trend: { value: 0, favorable: true }, spark: [] }}
                    index={index}
                    loading
                  />
                ))}
          </div>

          <DashboardAnalytics view={view} loading={status === "loading"} />

          <RecentPaymentsTable
            rows={view?.recentPayments ?? []}
            loading={status === "loading"}
          />
        </div>
      )}
    </div>
  );
}
