"use client";

import {
  BadgeCheck,
  CalendarClock,
  CalendarPlus,
  CircleDollarSign,
  Download,
  LayoutGrid,
  Layers,
  List,
  Plus,
  RefreshCw,
  Repeat,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  cancelMembership,
  deactivatePlan,
  freezeMembership,
  listMembers,
  listMemberships,
  listPayments,
  listPlans,
  paiseToAmount,
  updatePlan,
  type MemberDto,
  type MembershipWithRelationsDto,
  type PaymentDto,
  type PlanDto,
} from "@/lib/members-api";
import {
  EXPIRING_WINDOW_DAYS,
  groupPaymentsByMember,
  monthlyValuePaise,
  paymentStatusFor,
  toSubscriptionRow,
  type ExpiryFilter,
  type PaymentStatus,
  type SubscriptionRow,
  type SubscriptionStatus,
} from "@/lib/membership-view";
import { useToast } from "./providers/ToastProvider";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { DashboardCard } from "./DashboardCard";
import { AssignMembershipDrawer } from "./AssignMembershipDrawer";
import { ExpiryReminders } from "./ExpiryReminders";
import { MembershipDetailsDrawer } from "./MembershipDetailsDrawer";
import { MembershipFilters } from "./MembershipFilters";
import { MembershipPlanCard } from "./MembershipPlanCard";
import { MembershipPlansTable } from "./MembershipPlansTable";
import {
  compareRows,
  MembershipRecordsTable,
  type RecordsSortKey,
  type SortDir,
} from "./MembershipRecordsTable";
import { PlanFormDrawer } from "./PlanFormDrawer";
import { RecordPaymentDrawer } from "./RecordPaymentDrawer";

type PlanStatusFilter = "All" | "Active" | "Inactive";
type PlanView = "grid" | "table";

function matchesExpiryFilter(row: SubscriptionRow, filter: ExpiryFilter): boolean {
  switch (filter) {
    case "Today":
      return row.status === "Expiring" && row.daysLeft <= 0;
    case "7":
      return (
        (row.status === "Active" || row.status === "Expiring") &&
        row.daysLeft >= 0 &&
        row.daysLeft <= 7
      );
    case "30":
      return (
        (row.status === "Active" || row.status === "Expiring") &&
        row.daysLeft >= 0 &&
        row.daysLeft <= 30
      );
    case "Expired":
      return row.status === "Expired";
    default:
      return true;
  }
}

export function MembershipsPage() {
  const toast = useToast();

  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [memberships, setMemberships] = useState<MembershipWithRelationsDto[]>([]);
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Records (subscriptions) filters
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | SubscriptionStatus>("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState<"All" | PaymentStatus>("All");
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("All");
  const [sortKey, setSortKey] = useState<RecordsSortKey>("expires");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Plans view controls
  const [planView, setPlanView] = useState<PlanView>("grid");
  const [planStatusFilter, setPlanStatusFilter] = useState<PlanStatusFilter>("All");

  const [planDrawer, setPlanDrawer] = useState<{ open: boolean; plan: PlanDto | null }>(
    { open: false, plan: null },
  );
  const [assignDrawer, setAssignDrawer] = useState<{
    open: boolean;
    renewal: SubscriptionRow | null;
    planId: string | null;
  }>({ open: false, renewal: null, planId: null });
  const [details, setDetails] = useState<SubscriptionRow | null>(null);
  const [recordPayment, setRecordPayment] = useState<SubscriptionRow | null>(null);
  const [confirm, setConfirm] = useState<
    { action: "freeze" | "cancel"; row: SubscriptionRow } | null
  >(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [planAction, setPlanAction] = useState<PlanDto | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "initial") {
        setStatus("loading");
        setError(null);
      } else {
        setRefreshing(true);
      }
      try {
        const [planData, membershipData, memberData, paymentData] = await Promise.all([
          listPlans(),
          listMemberships(),
          listMembers(),
          listPayments().catch(() => [] as PaymentDto[]),
        ]);
        setPlans(planData);
        setMemberships(membershipData);
        setMembers(memberData);
        setPayments(paymentData);
        setStatus("ready");
      } catch (caught) {
        const message =
          caught instanceof ApiError
            ? caught.message
            : "Couldn't load memberships. Please try again.";
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

  const paymentsByMember = useMemo(() => groupPaymentsByMember(payments), [payments]);
  const rows = useMemo(
    () => memberships.map((membership) => toSubscriptionRow(membership, paymentsByMember)),
    [memberships, paymentsByMember],
  );

  /* -- Stats -------------------------------------------------------------- */
  const stats = useMemo(() => {
    const active = rows.filter((row) => row.status === "Active" || row.status === "Expiring");
    const expiring = rows.filter(
      (row) =>
        (row.status === "Active" || row.status === "Expiring") &&
        row.daysLeft >= 0 &&
        row.daysLeft <= EXPIRING_WINDOW_DAYS,
    );
    const mrrPaise = memberships
      .filter((membership) => {
        const row = rows.find((candidate) => candidate.id === membership.id);
        return row?.status === "Active" || row?.status === "Expiring";
      })
      .reduce((total, membership) => total + monthlyValuePaise(membership), 0);
    const outstandingPaise = rows.reduce((total, row) => total + row.balancePaise, 0);
    return {
      totalPlans: plans.length,
      activeSubscriptions: active.length,
      expiringSoon: expiring.length,
      mrrPaise,
      outstandingPaise,
    };
  }, [plans.length, rows, memberships]);

  const activeCountByPlan = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      if (row.status !== "Active" && row.status !== "Expiring") continue;
      map.set(row.planId, (map.get(row.planId) ?? 0) + 1);
    }
    return map;
  }, [rows]);

  const planOptions = useMemo(
    () => [...plans].sort((a, b) => a.name.localeCompare(b.name)),
    [plans],
  );

  const filteredPlans = useMemo(() => {
    if (planStatusFilter === "All") return planOptions;
    const wantActive = planStatusFilter === "Active";
    return planOptions.filter((plan) => plan.isActive === wantActive);
  }, [planOptions, planStatusFilter]);

  /* -- Filter / sort / paginate ------------------------------------------ */
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      const haystack =
        `${row.memberName} ${row.memberCode} ${row.memberPhone} ${row.planName}`.toLowerCase();
      const matchesQuery = !term || haystack.includes(term);
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      const matchesPlan = planFilter === "All" || row.planId === planFilter;
      const matchesPayment =
        paymentFilter === "All" || paymentStatusFor(row) === paymentFilter;
      return (
        matchesQuery &&
        matchesStatus &&
        matchesPlan &&
        matchesPayment &&
        matchesExpiryFilter(row, expiryFilter)
      );
    });
  }, [rows, query, statusFilter, planFilter, paymentFilter, expiryFilter]);

  const sorted = useMemo(() => {
    const direction = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => compareRows(a, b, sortKey) * direction);
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, planFilter, paymentFilter, expiryFilter, sortKey, sortDir]);

  const filtersActive =
    query.trim() !== "" ||
    statusFilter !== "All" ||
    planFilter !== "All" ||
    paymentFilter !== "All" ||
    expiryFilter !== "All";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("All");
    setPlanFilter("All");
    setPaymentFilter("All");
    setExpiryFilter("All");
  };

  const toggleSort = (key: RecordsSortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  /* -- Actions ------------------------------------------------------------ */
  const exportCsv = () => {
    const header = [
      "Member ID",
      "Member",
      "Phone",
      "Plan",
      "Start",
      "Expiry",
      "Total Fee",
      "Paid",
      "Balance",
      "Payment",
      "Status",
    ];
    const lines = sorted.map((row) => [
      row.memberCode,
      row.memberName,
      row.memberPhone,
      row.planName,
      row.startDate.slice(0, 10),
      row.endDate.slice(0, 10),
      (row.feePaise / 100).toFixed(2),
      (row.paidPaise / 100).toFixed(2),
      (row.balancePaise / 100).toFixed(2),
      paymentStatusFor(row),
      row.status,
    ]);
    const csv = [header, ...lines]
      .map((columns) =>
        columns.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `memberships-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Export ready", `${sorted.length} membership(s) exported to CSV.`);
  };

  const openAssign = (renewal: SubscriptionRow | null = null, planId: string | null = null) =>
    setAssignDrawer({ open: true, renewal, planId });

  const handleMembershipConfirm = useCallback(async () => {
    if (!confirm) return;
    setConfirmBusy(true);
    try {
      const { action, row } = confirm;
      await toast.promise(
        action === "freeze" ? freezeMembership(row.id) : cancelMembership(row.id),
        {
          loading: {
            title: action === "freeze" ? "Freezing membership…" : "Cancelling membership…",
            description: `${row.memberName}'s ${row.planName} subscription is being updated.`,
          },
          success: {
            title: action === "freeze" ? "Membership frozen" : "Membership cancelled",
            description: `${row.memberName}'s ${row.planName} subscription was updated.`,
          },
          error: (caught) => ({
            title: "Action failed",
            description:
              caught instanceof ApiError ? caught.message : "Please try again.",
          }),
        },
      );
      setConfirm(null);
      setDetails((current) => (current?.id === row.id ? null : current));
      await load("refresh");
    } catch {
      // The toast explains the failure; the dialog stays open for a retry.
    } finally {
      setConfirmBusy(false);
    }
  }, [confirm, load, toast]);

  const handleDeactivatePlan = useCallback(async () => {
    if (!planAction) return;
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
      setPlanAction(null);
      await load("refresh");
    } catch {
      // Keep the confirmation dialog open so the action can be retried.
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
        await load("refresh");
      } catch {
        // Toast covers the error; the list stays unchanged.
      }
    },
    [load, toast],
  );

  const showEmpty = status === "ready" && memberships.length === 0;
  const showNoResults = status === "ready" && memberships.length > 0 && filtered.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="animate-fade-up">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
            Membership Management
          </h1>
          <p className="mt-1.5 text-sm text-subtle">
            Manage plans, member subscriptions, renewals, and expirations.
          </p>
        </div>
        <div
          className="animate-fade-up flex flex-wrap gap-2.5"
          style={{ animationDelay: "80ms" }}
        >
          <Button variant="secondary" size="md" onClick={exportCsv} disabled={sorted.length === 0}>
            <Download className="size-4" strokeWidth={1.75} aria-hidden />
            Export
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => openAssign()}
            disabled={status !== "ready"}
          >
            <CalendarPlus className="size-4" strokeWidth={1.75} aria-hidden />
            Assign Membership
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
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 lg:mt-8">
        <StatTile
          label="Total Plans"
          value={formatNumber(stats.totalPlans)}
          helper={`${planOptions.length} available to assign`}
          icon={Layers}
          delay={0}
        />
        <StatTile
          label="Active Memberships"
          value={formatNumber(stats.activeSubscriptions)}
          helper={`${memberships.length} total on record`}
          icon={BadgeCheck}
          delay={60}
        />
        <StatTile
          label="Expiring Soon"
          value={formatNumber(stats.expiringSoon)}
          helper={`Within the next ${EXPIRING_WINDOW_DAYS} days`}
          icon={CalendarClock}
          delay={120}
          tone={stats.expiringSoon > 0 ? "warning" : "gold"}
        />
        <StatTile
          label="Monthly Revenue"
          value={formatCurrency(paiseToAmount(stats.mrrPaise))}
          helper={`${formatCurrency(paiseToAmount(stats.outstandingPaise))} outstanding`}
          icon={CircleDollarSign}
          delay={180}
        />
      </div>

      {/* Plans + expiry reminders */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3 lg:mt-6">
        <div className="xl:col-span-2">
          <DashboardCard
            title="Membership plans"
            subtitle={`${filteredPlans.length} of ${plans.length} plan${
              plans.length === 1 ? "" : "s"
            }`}
            icon={Layers}
            delay={40}
            className="h-full"
            action={
              <div className="flex items-center gap-1.5">
                <div className="flex items-center rounded-lg border border-line bg-card p-0.5">
                  <button
                    type="button"
                    onClick={() => setPlanView("grid")}
                    aria-label="Grid view"
                    aria-pressed={planView === "grid"}
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-md transition-colors",
                      planView === "grid"
                        ? "bg-gold/15 text-gold"
                        : "text-faint hover:text-ink",
                    )}
                  >
                    <LayoutGrid className="size-3.5" strokeWidth={1.75} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanView("table")}
                    aria-label="Table view"
                    aria-pressed={planView === "table"}
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-md transition-colors",
                      planView === "table"
                        ? "bg-gold/15 text-gold"
                        : "text-faint hover:text-ink",
                    )}
                  >
                    <List className="size-3.5" strokeWidth={1.75} aria-hidden />
                  </button>
                </div>
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
              </div>
            }
          >
            {plans.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {(["All", "Active", "Inactive"] as PlanStatusFilter[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPlanStatusFilter(item)}
                    aria-pressed={planStatusFilter === item}
                    className={cn(
                      "h-8 rounded-lg px-3 text-xs font-medium transition-colors",
                      planStatusFilter === item
                        ? "gold-surface text-[#1A1503] shadow-gold"
                        : "border border-line bg-card text-subtle hover:bg-card-hover hover:text-ink",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            {status === "loading" ? (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`plan-skeleton-${index}`}
                    className="h-40 animate-pulse rounded-xl border border-line/70 bg-card-hover/40"
                  />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold/10 text-gold ring-1 ring-inset ring-gold/20">
                  <Layers className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <p className="mt-4 text-sm font-semibold text-ink">No plans yet</p>
                <p className="mt-1 max-w-sm text-sm text-subtle">
                  Create your first membership plan to start assigning subscriptions.
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
            ) : filteredPlans.length === 0 ? (
              <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-medium text-ink">No {planStatusFilter.toLowerCase()} plans</p>
                <p className="mt-1 max-w-sm text-sm text-subtle">
                  The plans API only returns active plans, so inactive plans aren&apos;t listed here.
                </p>
                <Button
                  variant="secondary"
                  size="md"
                  className="mt-4"
                  onClick={() => setPlanStatusFilter("All")}
                >
                  Show all plans
                </Button>
              </div>
            ) : planView === "grid" ? (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filteredPlans.map((plan) => (
                  <MembershipPlanCard
                    key={plan.id}
                    plan={plan}
                    activeCount={activeCountByPlan.get(plan.id) ?? 0}
                    onEdit={() => setPlanDrawer({ open: true, plan })}
                    onAssign={() => openAssign(null, plan.id)}
                    onDeactivate={() => setPlanAction(plan)}
                    onReactivate={() => handleReactivatePlan(plan)}
                  />
                ))}
              </div>
            ) : (
              <MembershipPlansTable
                plans={filteredPlans}
                activeCountByPlan={activeCountByPlan}
                onEdit={(plan) => setPlanDrawer({ open: true, plan })}
                onAssign={(plan) => openAssign(null, plan.id)}
                onDeactivate={(plan) => setPlanAction(plan)}
                onReactivate={handleReactivatePlan}
              />
            )}
          </DashboardCard>
        </div>

        <ExpiryReminders
          rows={rows}
          loading={status === "loading"}
          onRenew={(row) => openAssign(row)}
          delay={80}
        />
      </div>

      {/* Subscriptions */}
      <div className="mt-5 lg:mt-6">
        <DashboardCard
          title="Membership records"
          subtitle={`${filtered.length} of ${memberships.length} membership${
            memberships.length === 1 ? "" : "s"
          }`}
          icon={Repeat}
          delay={60}
        >
          <MembershipFilters
            query={query}
            onQueryChange={setQuery}
            planFilter={planFilter}
            planOptions={planOptions}
            onPlanFilterChange={setPlanFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            paymentFilter={paymentFilter}
            onPaymentFilterChange={setPaymentFilter}
            expiryFilter={expiryFilter}
            onExpiryFilterChange={setExpiryFilter}
            filtersActive={filtersActive}
            onClearFilters={clearFilters}
          />

          <MembershipRecordsTable
            rows={pageRows}
            totalCount={sorted.length}
            loading={status === "loading"}
            error={status === "error" ? error : null}
            onRetry={() => load("initial")}
            empty={showEmpty}
            noResults={showNoResults}
            onClearFilters={clearFilters}
            onAssign={() => openAssign()}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleSort={toggleSort}
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
            onView={setDetails}
            onRenew={(row) => openAssign(row)}
            onFreeze={(row) => setConfirm({ action: "freeze", row })}
            onCancel={(row) => setConfirm({ action: "cancel", row })}
            onRecordPayment={setRecordPayment}
          />
        </DashboardCard>
      </div>

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
        renewal={assignDrawer.renewal}
        initialPlanId={assignDrawer.planId}
        onOpenChange={(open) => setAssignDrawer((current) => ({ ...current, open }))}
        onSaved={() => load("refresh")}
      />

      <RecordPaymentDrawer
        open={Boolean(recordPayment)}
        row={recordPayment}
        onOpenChange={(open) => !open && setRecordPayment(null)}
        onSaved={() => load("refresh")}
      />

      <MembershipDetailsDrawer
        row={details}
        payments={details ? paymentsByMember.get(details.memberId) ?? [] : []}
        open={Boolean(details)}
        onOpenChange={(open) => !open && setDetails(null)}
        onRenew={(row) => {
          setDetails(null);
          openAssign(row);
        }}
        onFreeze={(row) => setConfirm({ action: "freeze", row })}
        onCancel={(row) => setConfirm({ action: "cancel", row })}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.action === "freeze" ? "Freeze this membership?" : "Cancel this membership?"}
        description={
          confirm
            ? confirm.action === "freeze"
              ? `${confirm.row.memberName}'s ${confirm.row.planName} membership will be frozen. Existing payment history is preserved.`
              : `${confirm.row.memberName}'s ${confirm.row.planName} membership will be cancelled. This keeps the record for history but ends the subscription.`
            : undefined
        }
        confirmLabel={confirm?.action === "freeze" ? "Freeze membership" : "Cancel membership"}
        loading={confirmBusy}
        onConfirm={handleMembershipConfirm}
        onCancel={() => !confirmBusy && setConfirm(null)}
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
        onConfirm={handleDeactivatePlan}
        onCancel={() => setPlanAction(null)}
      />
    </div>
  );
}

/* -- Local components ----------------------------------------------------- */

function StatTile({
  label,
  value,
  helper,
  icon: Icon,
  delay = 0,
  tone = "gold",
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof Layers;
  delay?: number;
  tone?: "gold" | "warning";
}) {
  return (
    <section
      style={{ animationDelay: `${delay}ms` }}
      className="animate-fade-up flex flex-col rounded-card border border-line bg-card p-5 shadow-card transition-colors duration-200 hover:border-line-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-faint">{label}</p>
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
            tone === "warning"
              ? "bg-warning/12 text-warning ring-warning/20"
              : "bg-gold/12 text-gold ring-gold/20",
          )}
        >
          <Icon className="size-4.5" strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      <p className="mt-4 text-[28px] leading-none font-bold tracking-tight text-ink tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-xs text-faint">{helper}</p>
    </section>
  );
}
