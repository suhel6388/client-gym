"use client";

import {
  ArrowUpRight,
  Download,
  Dumbbell,
  Plus,
  Power,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  deactivatePlan,
  listMembers,
  listMemberships,
  listPlans,
  paiseToAmount,
  updatePlan,
  type MemberDto,
  type MembershipWithRelationsDto,
  type PlanDto,
} from "@/lib/members-api";
import {
  adoptionByPlan,
  billingIntervalLabel,
  durationLabel,
  monthlyEquivalentPaise,
  summarizePlans,
} from "@/lib/plans-view";
import { useToast } from "./providers/ToastProvider";
import { Button } from "./ui/Button";
import { AssignMembershipDrawer } from "./AssignMembershipDrawer";
import { ConfirmDialog } from "./ConfirmDialog";
import { DashboardCard } from "./DashboardCard";
import { PlanComparisonTable } from "./PlanComparisonTable";
import { PlanDetailsDrawer } from "./PlanDetailsDrawer";
import { PlanFormDrawer } from "./PlanFormDrawer";
import { PlanPricingCard } from "./PlanPricingCard";
import { PlanStatsCards } from "./PlanStatsCards";

export function PlansPage() {
  const toast = useToast();
  const router = useRouter();

  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [memberships, setMemberships] = useState<MembershipWithRelationsDto[]>([]);
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [planDrawer, setPlanDrawer] = useState<{ open: boolean; plan: PlanDto | null }>(
    { open: false, plan: null },
  );
  const [assignDrawer, setAssignDrawer] = useState<{ open: boolean; planId: string | null }>(
    { open: false, planId: null },
  );
  const [detailsPlan, setDetailsPlan] = useState<PlanDto | null>(null);
  const [planAction, setPlanAction] = useState<PlanDto | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  /** Plans deactivated this session. The API lists active plans only, so the
   *  strip below is the only place they stay visible (and reactivatable). */
  const [retired, setRetired] = useState<PlanDto[]>([]);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "initial") {
        setStatus("loading");
        setError(null);
      } else {
        setRefreshing(true);
      }
      try {
        const [planData, membershipData, memberData] = await Promise.all([
          listPlans(),
          listMemberships(),
          listMembers(),
        ]);
        setPlans(planData);
        setMemberships(membershipData);
        setMembers(memberData);
        setStatus("ready");
      } catch (caught) {
        const message =
          caught instanceof ApiError
            ? caught.message
            : "Couldn't load plans. Please try again.";
        if (mode === "initial") {
          setError(message);
          setStatus("error");
        } else {
          toast.error("Refresh failed", message);
        }
      } finally {
        setRefreshing(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    load("initial");
  }, [load]);

  const adoption = useMemo(() => adoptionByPlan(memberships), [memberships]);
  const performance = useMemo(
    () => summarizePlans(plans, memberships),
    [plans, memberships],
  );

  /** Pricing order: cheapest full-term price first. */
  const sortedPlans = useMemo(
    () =>
      [...plans].sort(
        (a, b) => a.pricePaise - b.pricePaise || a.name.localeCompare(b.name),
      ),
    [plans],
  );

  const topPlans = useMemo(
    () =>
      [...plans]
        .map((plan) => ({ plan, active: adoption.get(plan.id)?.active ?? 0 }))
        .sort((a, b) => b.active - a.active || a.plan.pricePaise - b.plan.pricePaise)
        .slice(0, 6),
    [plans, adoption],
  );

  /* -- Actions ------------------------------------------------------------ */
  const exportCsv = () => {
    const header = [
      "Plan",
      "Duration (months)",
      "Cadence",
      "Price",
      "Per Month",
      "Active",
      "Total Subscriptions",
      "Monthly Revenue",
      "Status",
      "Created",
    ];
    const lines = sortedPlans.map((plan) => {
      const entry = adoption.get(plan.id);
      return [
        plan.name,
        String(plan.durationMonths),
        billingIntervalLabel(plan.durationMonths),
        (plan.pricePaise / 100).toFixed(2),
        (monthlyEquivalentPaise(plan) / 100).toFixed(2),
        String(entry?.active ?? 0),
        String(entry?.total ?? 0),
        ((entry?.mrrPaise ?? 0) / 100).toFixed(2),
        plan.isActive ? "Active" : "Inactive",
        plan.createdAt.slice(0, 10),
      ];
    });
    const csv = [header, ...lines]
      .map((columns) =>
        columns.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `plans-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Export ready", `${sortedPlans.length} plan(s) exported to CSV.`);
  };

  const handleDeactivatePlan = useCallback(async () => {
    if (!planAction) return;
    setConfirmBusy(true);
    try {
      await toast.promise(deactivatePlan(planAction.id), {
        loading: {
          title: "Deactivating plan…",
          description: `${planAction.name} will no longer be assignable.`,
        },
        success: {
          title: "Plan deactivated",
          description: `${planAction.name} is no longer available.`,
        },
        error: (caught) => ({
          title: "Couldn't deactivate plan",
          description:
            caught instanceof ApiError ? caught.message : "Please try again.",
        }),
      });
      setRetired((current) =>
        current.some((plan) => plan.id === planAction.id)
          ? current
          : [planAction, ...current],
      );
      setPlanAction(null);
      setDetailsPlan(null);
      await load("refresh");
    } catch {
      // Keep the confirmation dialog open so the action can be retried.
    } finally {
      setConfirmBusy(false);
    }
  }, [planAction, load, toast]);

  const handleReactivatePlan = useCallback(
    async (plan: PlanDto) => {
      try {
        await toast.promise(updatePlan(plan.id, { isActive: true }), {
          loading: {
            title: "Reactivating plan…",
            description: `${plan.name} will be available for new assignments.`,
          },
          success: {
            title: "Plan reactivated",
            description: `${plan.name} is available again.`,
          },
          error: (caught) => ({
            title: "Couldn't reactivate plan",
            description:
              caught instanceof ApiError ? caught.message : "Please try again.",
          }),
        });
        setRetired((current) => current.filter((entry) => entry.id !== plan.id));
        await load("refresh");
      } catch {
        // Toast covers the error; the list stays unchanged.
      }
    },
    [load, toast],
  );

  const openDetails = (plan: PlanDto) => setDetailsPlan(plan);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="animate-fade-up">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
            Plans &amp; Pricing
          </h1>
          <p className="mt-1.5 text-sm text-subtle">
            Manage subscription plans, pricing, and membership features for your gym
            management platform.
          </p>
        </div>
        <div
          className="animate-fade-up flex flex-wrap gap-2.5"
          style={{ animationDelay: "80ms" }}
        >
          <Button
            variant="secondary"
            size="md"
            onClick={exportCsv}
            disabled={sortedPlans.length === 0}
          >
            <Download className="size-4" strokeWidth={1.75} aria-hidden />
            Export
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setPlanDrawer({ open: true, plan: null })}
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            Create Plan
          </Button>
        </div>
      </div>

      {/* Stats */}
      <PlanStatsCards performance={performance} loading={status === "loading"} />

      {/* Pricing + performance */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3 lg:mt-6">
        <div className="xl:col-span-2">
          <DashboardCard
            title="Membership plans"
            subtitle={`${sortedPlans.length} plan${sortedPlans.length === 1 ? "" : "s"} · sorted by price`}
            icon={Dumbbell}
            delay={40}
            className="h-full"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => load("refresh")}
                disabled={refreshing || status === "loading"}
              >
                <RefreshCw
                  className={cn("size-3.5", refreshing && "animate-spin")}
                  strokeWidth={1.75}
                  aria-hidden
                />
                Refresh
              </Button>
            }
          >
            {status === "loading" ? (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`plan-skeleton-${index}`}
                    className="h-64 animate-pulse rounded-card border border-line/70 bg-card-hover/40"
                  />
                ))}
              </div>
            ) : status === "error" ? (
              <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-semibold text-ink">Couldn&apos;t load plans</p>
                <p className="mt-1 max-w-md text-sm text-subtle">{error}</p>
                <Button variant="primary" size="md" className="mt-4" onClick={() => load("initial")}>
                  <RefreshCw className="size-4" strokeWidth={2} aria-hidden />
                  Try again
                </Button>
              </div>
            ) : sortedPlans.length === 0 ? (
              <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold/10 text-gold ring-1 ring-inset ring-gold/20">
                  <Dumbbell className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <p className="mt-4 text-sm font-semibold text-ink">No plans yet</p>
                <p className="mt-1 max-w-sm text-sm text-subtle">
                  Create your first membership plan to start selling subscriptions.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  className="mt-4"
                  onClick={() => setPlanDrawer({ open: true, plan: null })}
                >
                  <Plus className="size-4" strokeWidth={2} aria-hidden />
                  Create plan
                </Button>
              </div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {sortedPlans.map((plan) => (
                    <PlanPricingCard
                      key={plan.id}
                      plan={plan}
                      activeCount={adoption.get(plan.id)?.active ?? 0}
                      totalCount={adoption.get(plan.id)?.total ?? 0}
                      isMostPopular={performance.mostPopularPlanId === plan.id}
                      onAssign={() => setAssignDrawer({ open: true, planId: plan.id })}
                      onEdit={() => setPlanDrawer({ open: true, plan })}
                      onDeactivate={() => setPlanAction(plan)}
                      onView={() => openDetails(plan)}
                    />
                  ))}
                </div>
                {performance.mostPopularPlanId && (
                  <p className="mt-4 text-[11px] leading-relaxed text-faint">
                    Most Popular marks the plan with the most active subscriptions —
                    decided from live data, not configured anywhere.
                  </p>
                )}
              </>
            )}
          </DashboardCard>
        </div>

        <DashboardCard
          title="Plan performance"
          subtitle="Live adoption across plans"
          icon={ShieldCheck}
          delay={80}
          className="h-full"
          action={
            <Button variant="ghost" size="sm" onClick={() => router.push("/memberships")}>
              Memberships
              <ArrowUpRight className="size-3.5" strokeWidth={1.75} aria-hidden />
            </Button>
          }
        >
          {status === "loading" ? (
            <div className="mt-5 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`perf-skeleton-${index}`}
                  className="h-12 animate-pulse rounded-lg bg-card-hover/50"
                />
              ))}
            </div>
          ) : performance.activeSubscriptions === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm font-medium text-ink">No active subscriptions yet</p>
              <p className="mt-1 max-w-xs text-xs text-subtle">
                Assign a plan to a member and adoption will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {topPlans.map(({ plan, active }) => {
                const share =
                  performance.activeSubscriptions > 0
                    ? (active / performance.activeSubscriptions) * 100
                    : 0;
                return (
                  <div key={plan.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => openDetails(plan)}
                        className="truncate text-[13px] font-medium text-ink transition-colors hover:text-gold"
                      >
                        {plan.name}
                      </button>
                      <span className="shrink-0 text-xs tabular-nums text-subtle">
                        {formatNumber(active)} · {share.toFixed(0)}%
                      </span>
                    </div>
                    <div
                      className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-card-hover"
                      role="progressbar"
                      aria-valuenow={Math.round(share)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${plan.name} share of active subscriptions`}
                    >
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{ width: `${Math.max(3, Math.min(100, share))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between border-t border-line/60 pt-4 text-xs">
                <span className="text-faint">Monthly revenue</span>
                <span className="text-sm font-bold tabular-nums text-gold">
                  {formatCurrency(paiseToAmount(performance.mrrPaise))}
                </span>
              </div>
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Comparison */}
      {status !== "loading" && sortedPlans.length > 0 && (
        <div className="mt-5 lg:mt-6">
          <DashboardCard
            title="Compare plans"
            subtitle="Every stored plan attribute, side by side"
            icon={Dumbbell}
            delay={100}
          >
            <PlanComparisonTable
              plans={sortedPlans}
              adoption={adoption}
              mostPopularPlanId={performance.mostPopularPlanId}
            />
          </DashboardCard>
        </div>
      )}

      {/* Session-deactivated plans */}
      {retired.length > 0 && (
        <div className="mt-5 lg:mt-6">
          <DashboardCard
            title="Deactivated this session"
            subtitle="The plans API lists active plans only — reactivate from here"
            icon={Power}
            delay={120}
          >
            <ul className="mt-5 space-y-2.5">
              {retired.map((plan) => (
                <li
                  key={plan.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-line/70 bg-card-hover/30 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{plan.name}</p>
                    <p className="mt-0.5 text-[11px] text-faint">
                      {durationLabel(plan.durationMonths)} ·{" "}
                      {formatCurrency(paiseToAmount(plan.pricePaise))}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => handleReactivatePlan(plan)}>
                    <Power className="size-3.5" strokeWidth={1.75} aria-hidden />
                    Reactivate
                  </Button>
                </li>
              ))}
            </ul>
          </DashboardCard>
        </div>
      )}

      {/* Drawers + dialogs */}
      <PlanFormDrawer
        open={planDrawer.open}
        plan={planDrawer.plan}
        onOpenChange={(open) => setPlanDrawer((current) => ({ ...current, open }))}
        onSaved={() => load("refresh")}
      />

      <AssignMembershipDrawer
        open={assignDrawer.open}
        plans={plans}
        members={members}
        renewal={null}
        initialPlanId={assignDrawer.planId}
        onOpenChange={(open) => setAssignDrawer((current) => ({ ...current, open }))}
        onSaved={() => load("refresh")}
      />

      <PlanDetailsDrawer
        plan={detailsPlan}
        activeCount={detailsPlan ? (adoption.get(detailsPlan.id)?.active ?? 0) : 0}
        totalCount={detailsPlan ? (adoption.get(detailsPlan.id)?.total ?? 0) : 0}
        mrrPaise={detailsPlan ? (adoption.get(detailsPlan.id)?.mrrPaise ?? 0) : 0}
        sharePct={
          detailsPlan && performance.activeSubscriptions > 0
            ? ((adoption.get(detailsPlan.id)?.active ?? 0) / performance.activeSubscriptions) * 100
            : 0
        }
        isMostPopular={detailsPlan ? performance.mostPopularPlanId === detailsPlan.id : false}
        open={Boolean(detailsPlan)}
        onOpenChange={(open) => !open && setDetailsPlan(null)}
        onAssign={() => {
          if (!detailsPlan) return;
          const planId = detailsPlan.id;
          setDetailsPlan(null);
          setAssignDrawer({ open: true, planId });
        }}
        onEdit={() => {
          if (!detailsPlan) return;
          const plan = detailsPlan;
          setDetailsPlan(null);
          setPlanDrawer({ open: true, plan });
        }}
        onDeactivate={() => {
          if (!detailsPlan) return;
          setPlanAction(detailsPlan);
        }}
      />

      <ConfirmDialog
        open={Boolean(planAction)}
        title="Deactivate this plan?"
        description={
          planAction
            ? planAction.name +
              " will no longer be available for new assignments. Existing subscriptions stay active."
            : undefined
        }
        confirmLabel="Deactivate plan"
        loading={confirmBusy}
        onConfirm={handleDeactivatePlan}
        onCancel={() => !confirmBusy && setPlanAction(null)}
      />
    </div>
  );
}
