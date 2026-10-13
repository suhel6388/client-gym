"use client";

import {
  BadgeCheck,
  Ban,
  CalendarClock,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleDollarSign,
  Download,
  Eye,
  Layers,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Repeat,
  Search,
  SlidersHorizontal,
  Snowflake,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatCurrency, formatNumber, formatShortDate } from "@/lib/format";
import {
  cancelMembership,
  deactivatePlan,
  freezeMembership,
  listMembers,
  listMemberships,
  listPayments,
  listPlans,
  paiseToAmount,
  type MemberDto,
  type MembershipWithRelationsDto,
  type PaymentDto,
  type PlanDto,
} from "@/lib/members-api";
import {
  EXPIRING_WINDOW_DAYS,
  groupPaymentsByMember,
  monthlyValuePaise,
  subscriptionTone,
  toSubscriptionRow,
  type SubscriptionRow,
  type SubscriptionStatus,
} from "@/lib/membership-view";
import { useGlobalLoading } from "./providers/LoadingProvider";
import { useToast } from "./providers/ToastProvider";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { DashboardCard } from "./DashboardCard";
import { AssignMembershipDrawer } from "./AssignMembershipDrawer";
import { MembershipDetailsDrawer } from "./MembershipDetailsDrawer";
import { PlanFormDrawer } from "./PlanFormDrawer";

const STATUS_FILTERS: ("All" | SubscriptionStatus)[] = [
  "All",
  "Active",
  "Expiring",
  "Expired",
  "Frozen",
  "Cancelled",
];

const STATUS_ORDER: Record<SubscriptionStatus, number> = {
  Active: 0,
  Expiring: 1,
  Frozen: 2,
  Expired: 3,
  Cancelled: 4,
  Inactive: 5,
};

type SortKey = "member" | "plan" | "status" | "expires" | "fee";
type SortDir = "asc" | "desc";

function durationLabel(months: number): string {
  if (months <= 0) return "—";
  if (months % 12 === 0) {
    const years = months / 12;
    return `${months} months · ${years} yr`;
  }
  return `${months} month${months === 1 ? "" : "s"}`;
}

export function MembershipsPage() {
  const toast = useToast();
  const loading = useGlobalLoading();

  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [memberships, setMemberships] = useState<MembershipWithRelationsDto[]>([]);
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | SubscriptionStatus>("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("expires");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [planDrawer, setPlanDrawer] = useState<{ open: boolean; plan: PlanDto | null }>(
    { open: false, plan: null },
  );
  const [assignDrawer, setAssignDrawer] = useState<{
    open: boolean;
    renewal: SubscriptionRow | null;
  }>({ open: false, renewal: null });
  const [details, setDetails] = useState<SubscriptionRow | null>(null);
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

  /* -- Filter / sort / paginate ------------------------------------------ */
  const planOptions = useMemo(
    () => [...plans].sort((a, b) => a.name.localeCompare(b.name)),
    [plans],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      const haystack = `${row.memberName} ${row.memberCode} ${row.planName}`.toLowerCase();
      const matchesQuery = !term || haystack.includes(term);
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      const matchesPlan = planFilter === "All" || row.planId === planFilter;
      return matchesQuery && matchesStatus && matchesPlan;
    });
  }, [rows, query, statusFilter, planFilter]);

  const sorted = useMemo(() => {
    const direction = sortDir === "asc" ? 1 : -1;
    const compare = (a: SubscriptionRow, b: SubscriptionRow): number => {
      switch (sortKey) {
        case "member":
          return a.memberName.localeCompare(b.memberName) * direction;
        case "plan":
          return a.planName.localeCompare(b.planName) * direction;
        case "status":
          return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) * direction;
        case "fee":
          return (a.feePaise - b.feePaise) * direction;
        case "expires":
        default:
          return (
            (new Date(a.endDate).getTime() - new Date(b.endDate).getTime()) * direction
          );
      }
    };
    return [...filtered].sort(compare);
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, planFilter, sortKey, sortDir]);

  const filtersActive =
    query.trim() !== "" || statusFilter !== "All" || planFilter !== "All";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("All");
    setPlanFilter("All");
  };

  const toggleSort = (key: SortKey) => {
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
      "Member",
      "Code",
      "Plan",
      "Status",
      "Start",
      "Expires",
      "Fee",
      "Paid",
      "Balance",
    ];
    const lines = filtered.map((row) => [
      row.memberName,
      row.memberCode,
      row.planName,
      row.status,
      row.startDate.slice(0, 10),
      row.endDate.slice(0, 10),
      (row.feePaise / 100).toFixed(2),
      (row.paidPaise / 100).toFixed(2),
      (row.balancePaise / 100).toFixed(2),
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
    toast.success("Export ready", `${filtered.length} membership(s) exported to CSV.`);
  };

  const handleMembershipConfirm = useCallback(async () => {
    if (!confirm) return;
    setConfirmBusy(true);
    try {
      const { action, row } = confirm;
      await loading.run(
        action === "freeze" ? freezeMembership(row.id) : cancelMembership(row.id),
        action === "freeze" ? "Freezing membership…" : "Cancelling membership…",
      );
      toast.success(
        action === "freeze" ? "Membership frozen" : "Membership cancelled",
        `${row.memberName}'s ${row.planName} subscription was updated.`,
      );
      setConfirm(null);
      setDetails((current) => (current?.id === row.id ? null : current));
      await load("refresh");
    } catch (caught) {
      toast.error(
        "Action failed",
        caught instanceof ApiError ? caught.message : "Please try again.",
      );
    } finally {
      setConfirmBusy(false);
    }
  }, [confirm, load, loading, toast]);

  const handleDeactivatePlan = useCallback(async () => {
    if (!planAction) return;
    try {
      await loading.run(deactivatePlan(planAction.id), "Deactivating plan…");
      toast.success("Plan deactivated", `${planAction.name} is no longer available.`);
      setPlanAction(null);
      await load("refresh");
    } catch (caught) {
      toast.error(
        "Couldn't deactivate plan",
        caught instanceof ApiError ? caught.message : "Please try again.",
      );
    }
  }, [planAction, load, loading, toast]);

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
            Manage membership plans, subscriptions, renewals, and expirations.
          </p>
        </div>
        <div
          className="animate-fade-up flex flex-wrap gap-2.5"
          style={{ animationDelay: "80ms" }}
        >
          <Button variant="secondary" size="md" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="size-4" strokeWidth={1.75} aria-hidden />
            Export
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setAssignDrawer({ open: true, renewal: null })}
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
          label="Active Subscriptions"
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
          label="Est. Monthly Revenue"
          value={formatCurrency(paiseToAmount(stats.mrrPaise))}
          helper={`${formatCurrency(paiseToAmount(stats.outstandingPaise))} outstanding`}
          icon={CircleDollarSign}
          delay={180}
        />
      </div>

      {/* Plans */}
      <div className="mt-5 lg:mt-6">
        <DashboardCard
          title="Membership plans"
          subtitle={`${plans.length} active plan${plans.length === 1 ? "" : "s"}`}
          icon={Layers}
          delay={40}
          action={
            <Button
              variant="secondary"
              size="md"
              onClick={() => load("refresh")}
              disabled={refreshing || status === "loading"}
            >
              <RefreshCw
                className={cn("size-4", refreshing && "animate-spin")}
                strokeWidth={1.75}
                aria-hidden
              />
              Refresh
            </Button>
          }
        >
          {status === "loading" ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
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
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {planOptions.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  activeCount={activeCountByPlan.get(plan.id) ?? 0}
                  onEdit={() => setPlanDrawer({ open: true, plan })}
                  onDeactivate={() => setPlanAction(plan)}
                />
              ))}
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Subscriptions */}
      <div className="mt-5 lg:mt-6">
        <DashboardCard
          title="Subscriptions"
          subtitle={`${filtered.length} of ${memberships.length} membership${
            memberships.length === 1 ? "" : "s"
          }`}
          icon={Repeat}
          delay={60}
        >
          {/* Toolbar */}
          <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by member or plan…"
                  aria-label="Search subscriptions"
                  className="h-9 w-full rounded-lg border border-line bg-card pr-3 pl-9 text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-gold/50"
                />
              </div>
              <div className="relative">
                <SlidersHorizontal
                  className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <select
                  value={planFilter}
                  onChange={(event) => setPlanFilter(event.target.value)}
                  aria-label="Filter by plan"
                  className="h-9 w-full appearance-none rounded-lg border border-line bg-card pr-8 pl-9 text-[13px] text-ink outline-none transition-colors focus:border-gold/50 sm:w-48"
                >
                  <option value="All">All plans</option>
                  {planOptions.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStatusFilter(item)}
                  aria-pressed={statusFilter === item}
                  className={cn(
                    "h-8 rounded-lg px-3 text-xs font-medium transition-colors",
                    statusFilter === item
                      ? "gold-surface text-[#1A1503] shadow-gold"
                      : "border border-line bg-card text-subtle hover:bg-card-hover hover:text-ink",
                  )}
                >
                  {item}
                </button>
              ))}
              {filtersActive && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-8 rounded-lg px-3 text-xs font-medium text-gold transition-colors hover:bg-gold/10"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="mt-5 overflow-x-auto rounded-xl border border-line/80">
            <table className="w-full min-w-[1000px] divide-y divide-line/60">
              <thead>
                <tr className="bg-card-hover/40">
                  <SortHeader label="Member" sortKey="member" active={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Plan" sortKey="plan" active={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Status" sortKey="status" active={sortKey} dir={sortDir} onSort={toggleSort} />
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Started
                  </th>
                  <SortHeader label="Expires" sortKey="expires" active={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Fee" sortKey="fee" active={sortKey} dir={sortDir} onSort={toggleSort} />
                  <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 bg-card/60">
                {status === "loading" &&
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={`sub-skeleton-${index}`} className="animate-pulse">
                      {Array.from({ length: 7 }).map((__, cell) => (
                        <td key={cell} className="px-4 py-3.5">
                          <div className="h-3.5 rounded bg-card-hover" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {status === "ready" &&
                  pageRows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-card-hover/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar initials={row.memberInitials} index={row.memberCode.charCodeAt(row.memberCode.length - 1) % 4} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">{row.memberName}</p>
                            <p className="truncate font-mono text-[11px] text-faint">{row.memberCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="gold">{row.planName}</Badge>
                        <p className="mt-1 text-[11px] text-faint">{durationLabel(row.durationMonths)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={subscriptionTone(row.status)} dot>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-subtle">
                        {formatShortDate(row.startDate.slice(0, 10))}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-subtle">{formatShortDate(row.endDate.slice(0, 10))}</p>
                        {row.status === "Expiring" && (
                          <p className="mt-0.5 text-[11px] font-medium text-warning">
                            {row.daysLeft <= 0 ? "Due today" : `${row.daysLeft}d left`}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold tabular-nums text-ink">
                          {formatCurrency(paiseToAmount(row.feePaise))}
                        </p>
                        <p
                          className={cn(
                            "mt-0.5 text-[11px] tabular-nums",
                            row.balancePaise > 0 ? "text-warning" : "text-faint",
                          )}
                        >
                          {row.balancePaise > 0
                            ? `${formatCurrency(paiseToAmount(row.balancePaise))} due`
                            : "Paid"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetails(row)}
                            aria-label={`View ${row.memberName}`}
                          >
                            <Eye className="size-3.5" strokeWidth={1.75} aria-hidden />
                            View
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setAssignDrawer({ open: true, renewal: row })}
                            aria-label={`Renew ${row.memberName}`}
                          >
                            <Repeat className="size-3.5" strokeWidth={1.75} aria-hidden />
                            Renew
                          </Button>
                          {row.status !== "Frozen" &&
                            row.status !== "Cancelled" &&
                            row.status !== "Expired" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirm({ action: "freeze", row })}
                                aria-label={`Freeze ${row.memberName}`}
                              >
                                <Snowflake className="size-3.5" strokeWidth={1.75} aria-hidden />
                              </Button>
                            )}
                          {row.status !== "Cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirm({ action: "cancel", row })}
                              aria-label={`Cancel ${row.memberName}`}
                            >
                              <Ban className="size-3.5" strokeWidth={1.75} aria-hidden />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {status === "error" && (
            <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-semibold text-ink">Couldn&apos;t load memberships</p>
              <p className="mt-1 max-w-md text-sm text-subtle">{error}</p>
              <Button variant="primary" size="md" className="mt-4" onClick={() => load("initial")}>
                <RefreshCw className="size-4" strokeWidth={2} aria-hidden />
                Try again
              </Button>
            </div>
          )}

          {showEmpty && (
            <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold/10 text-gold ring-1 ring-inset ring-gold/20">
                <Repeat className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <p className="mt-4 text-sm font-semibold text-ink">No subscriptions yet</p>
              <p className="mt-1 max-w-sm text-sm text-subtle">
                Assign a plan to a member to create the first subscription.
              </p>
              <Button
                variant="primary"
                size="md"
                className="mt-4"
                onClick={() => setAssignDrawer({ open: true, renewal: null })}
              >
                <CalendarPlus className="size-4" strokeWidth={2} aria-hidden />
                Assign membership
              </Button>
            </div>
          )}

          {showNoResults && (
            <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-ink">No subscriptions found</p>
              <p className="mt-1 text-sm text-subtle">Try adjusting your search or filters.</p>
              <Button variant="secondary" size="md" className="mt-4" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}

          {status === "ready" && filtered.length > 0 && (
            <div className="mt-4 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-faint">
                Showing{" "}
                <span className="font-medium tabular-nums text-subtle">
                  {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, sorted.length)}
                </span>{" "}
                of <span className="font-medium tabular-nums text-subtle">{sorted.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-3.5" strokeWidth={2} aria-hidden />
                  Prev
                </Button>
                <span className="text-xs tabular-nums text-subtle">
                  Page {currentPage} of {pageCount}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage(currentPage + 1)}
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden />
                </Button>
              </div>
            </div>
          )}
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
        onOpenChange={(open) => setAssignDrawer((current) => ({ ...current, open }))}
        onSaved={() => load("refresh")}
      />

      <MembershipDetailsDrawer
        row={details}
        payments={details ? paymentsByMember.get(details.memberId) ?? [] : []}
        open={Boolean(details)}
        onOpenChange={(open) => !open && setDetails(null)}
        onRenew={(row) => {
          setDetails(null);
          setAssignDrawer({ open: true, renewal: row });
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

function PlanCard({
  plan,
  activeCount,
  onEdit,
  onDeactivate,
}: {
  plan: PlanDto;
  activeCount: number;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  return (
    <div className="group flex flex-col rounded-xl border border-line bg-card-hover/20 p-4 transition-colors hover:border-line-strong hover:bg-card-hover/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{plan.name}</p>
          <p className="mt-0.5 text-[11px] text-faint">{durationLabel(plan.durationMonths)}</p>
        </div>
        <Badge tone="gold">{`${activeCount} active`}</Badge>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[22px] leading-none font-bold tabular-nums text-gold">
            {formatCurrency(paiseToAmount(plan.pricePaise))}
          </p>
          <p className="mt-1 text-[11px] text-faint">
            {formatCurrency(paiseToAmount(Math.round(plan.pricePaise / Math.max(1, plan.durationMonths))))} / month
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-line/60 pt-3">
        <Button variant="secondary" size="sm" className="flex-1" onClick={onEdit}>
          <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDeactivate}
          aria-label={`Deactivate ${plan.name}`}
        >
          <Power className="size-3.5" strokeWidth={1.75} aria-hidden />
          Deactivate
        </Button>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  active,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = active === sortKey;
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-ink",
          isActive && "text-gold",
        )}
        aria-label={`Sort by ${label}`}
      >
        {label}
        {isActive ? (
          <span aria-hidden className="text-[9px]">
            {dir === "asc" ? "▲" : "▼"}
          </span>
        ) : (
          <ChevronsUpDown className="size-3 opacity-60" strokeWidth={2} aria-hidden />
        )}
      </button>
    </th>
  );
}
