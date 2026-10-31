"use client";

import {
  Banknote,
  CalendarCheck,
  CircleAlert,
  Download,
  Dumbbell,
  Info,
  PiggyBank,
  Printer,
  RefreshCw,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { inWindow, toDateKey, todayKey } from "@/lib/date-window";
import { formatCurrencyInr, formatNumber } from "@/lib/format";
import { paiseToAmount } from "@/lib/members-api";
import type {
  MembershipWithRelationsDto,
  PaymentDto,
} from "@/lib/members-api";
import type { ExpenseDto, MemberJoinDto } from "@/lib/api";
import { fetchReportsData } from "@/lib/reports-service";
import { summarizePayments, type PaymentRow } from "@/lib/payments-view";
import {
  buildTrendSeries,
  categoryBreakdown,
  windowLabel,
  type ExpenseRow,
  type TrendGranularity,
} from "@/lib/expenses-view";
import type { SubscriptionRow } from "@/lib/membership-view";
import {
  REPORT_RANGES,
  computeKpis,
  expenseModeBreakdown,
  paymentAmounts,
  previousRangeWindow,
  reportAnchor,
  reportWindow,
  summarizeMemberships,
  toReportRows,
  type ReportRange,
} from "@/lib/reports-view";
import { ActionMenu } from "./ActionMenu";
import { DashboardCard } from "./DashboardCard";
import { ReportDetailsTable, type ReportTab } from "./ReportDetailsTable";
import { ReportKpiCards } from "./ReportKpiCards";
import { ExpenseCategoryDonut } from "./charts/ExpenseCategoryDonut";
import { ExpenseTrendChart } from "./charts/ExpenseTrendChart";
import { PlanMixDonut } from "./charts/PlanMixDonut";
import { RevenueTrendChart } from "./charts/RevenueTrendChart";
import { useToast } from "./providers/ToastProvider";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";

const TABS: { value: ReportTab | "attendance"; label: string; icon: LucideIcon }[] = [
  { value: "revenue", label: "Revenue", icon: Banknote },
  { value: "expenses", label: "Expenses", icon: PiggyBank },
  { value: "memberships", label: "Memberships", icon: Users },
  { value: "attendance", label: "Attendance", icon: CalendarCheck },
];

const GRANULARITY_LABEL: Record<TrendGranularity, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
};

// Stable empty arrays — inline `[]` literals would get a new identity on
// every render, bust `ReportDetailsTable`'s `useMemo` and retrigger its
// `onFilteredRowsChange` effect into an update loop.
const EMPTY_PAYMENTS: PaymentRow[] = [];
const EMPTY_EXPENSES: ExpenseRow[] = [];
const EMPTY_SUBSCRIPTIONS: SubscriptionRow[] = [];

export function ReportsPage() {
  const toast = useToast();
  const router = useRouter();

  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [memberships, setMemberships] = useState<MembershipWithRelationsDto[]>([]);
  const [members, setMembers] = useState<MemberJoinDto[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [range, setRange] = useState<ReportRange>("month");
  const [customFrom, setCustomFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().slice(0, 10);
  });
  const [customTo, setCustomTo] = useState(todayKey());
  const [tab, setTab] = useState<ReportTab | "attendance">("revenue");
  const [exportRows, setExportRows] = useState<
    (PaymentRow | ExpenseRow | SubscriptionRow)[]
  >([]);

  const load = useCallback(
    async (mode: "initial" | "refresh", signal?: AbortSignal) => {
      if (mode === "initial") {
        setStatus("loading");
        setError(null);
      } else {
        setRefreshing(true);
      }
      try {
        const bundle = await fetchReportsData({ signal });
        if (signal?.aborted) return;
        setPayments(bundle.payments);
        setExpenses(bundle.expenses);
        setMemberships(bundle.memberships);
        setMembers(bundle.members);
        setStatus("ready");
      } catch (caught) {
        if (signal?.aborted) return;
        const message =
          caught instanceof ApiError
            ? caught.message
            : "Couldn't load report data. Please try again.";
        if (mode === "initial") {
          setError(message);
          setStatus("error");
        } else {
          toast.error("Refresh failed", message);
        }
      } finally {
        if (!signal?.aborted) setRefreshing(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    const controller = new AbortController();
    load("initial", controller.signal);
    return () => controller.abort();
  }, [load]);

  const anchor = useMemo(() => reportAnchor(), []);
  const window = useMemo(
    () => reportWindow(range, anchor, { from: customFrom, to: customTo }),
    [range, anchor, customFrom, customTo],
  );
  const prev = useMemo(() => previousRangeWindow(window), [window]);
  const windowText = windowLabel(window);
  const periodLabel =
    REPORT_RANGES.find((option) => option.value === range)?.label ?? "This month";

  const rows = useMemo(
    () => toReportRows({ payments, expenses, memberships, members }),
    [payments, expenses, memberships, members],
  );

  const kpis = useMemo(() => computeKpis(rows, window, prev), [rows, window, prev]);

  const rangedPayments = useMemo(
    () => rows.payments.filter((row) => inWindow(row.dateKey, window)),
    [rows, window],
  );
  const rangedExpenses = useMemo(
    () => rows.expenses.filter((row) => inWindow(row.dateKey, window)),
    [rows, window],
  );
  const startedSubscriptions = useMemo(
    () =>
      rows.subscriptions.filter((row) => {
        const time = new Date(row.startDate).getTime();
        if (Number.isNaN(time)) return false;
        return inWindow(toDateKey(new Date(time)), window);
      }),
    [rows, window],
  );

  const revenueTrend = useMemo(
    () => buildTrendSeries(paymentAmounts(rows.payments, window), window, anchor),
    [rows, window, anchor],
  );
  const expenseTrend = useMemo(
    () => buildTrendSeries(rangedExpenses, window, anchor),
    [rangedExpenses, window, anchor],
  );
  const categorySlices = useMemo(() => categoryBreakdown(rangedExpenses), [rangedExpenses]);
  const methodSummary = useMemo(
    () => summarizePayments(rangedPayments, anchor),
    [rangedPayments, anchor],
  );
  const modeSlices = useMemo(() => expenseModeBreakdown(rangedExpenses), [rangedExpenses]);
  const membershipReport = useMemo(
    () => summarizeMemberships(rows, window),
    [rows, window],
  );

  /* -- Export ------------------------------------------------------------- */
  const exportCsv = useCallback(() => {
    try {
      let header: string[];
      let lines: string[][];
      if (tab === "revenue") {
        header = ["Receipt", "Member", "Code", "Amount", "Method", "Date", "Status"];
        lines = (exportRows as PaymentRow[]).map((row) => [
          row.receiptNumber,
          row.memberName,
          row.memberCode,
          (row.amountPaise / 100).toFixed(2),
          row.modeLabel,
          row.dateKey,
          row.status,
        ]);
      } else if (tab === "expenses") {
        header = ["ID", "Title", "Category", "Amount", "Date", "Notes"];
        lines = (exportRows as ExpenseRow[]).map((row) => [
          String(row.id),
          row.title,
          row.category,
          (row.amountPaise / 100).toFixed(2),
          row.dateKey,
          row.notes ?? "",
        ]);
      } else {
        header = ["Member", "Code", "Plan", "Status", "Fee", "Paid", "Balance", "Start", "End"];
        lines = (exportRows as SubscriptionRow[]).map((row) => [
          row.memberName,
          row.memberCode,
          row.planName,
          row.status,
          (row.feePaise / 100).toFixed(2),
          (row.paidPaise / 100).toFixed(2),
          (row.balancePaise / 100).toFixed(2),
          row.startDate.slice(0, 10),
          row.endDate.slice(0, 10),
        ]);
      }
      const csv = [header, ...lines]
        .map((columns) =>
          columns.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchorEl = document.createElement("a");
      anchorEl.href = url;
      anchorEl.download = `reports-${tab}-${window.from ?? "all"}_${window.to ?? "all"}.csv`;
      anchorEl.click();
      URL.revokeObjectURL(url);
      toast.success("Export ready", `${lines.length} record(s) exported to CSV.`);
    } catch {
      toast.error("Export failed", "Couldn't generate the CSV file.");
    }
  }, [tab, exportRows, window, toast]);

  const printReport = useCallback(() => {
    try {
      globalThis.print();
    } catch {
      toast.error("Print failed", "Your browser blocked the print dialog.");
    }
  }, [toast]);

  if (status === "error") {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="animate-fade-up">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
            Reports &amp; Analytics
          </h1>
          <p className="mt-1.5 text-sm text-subtle">
            Track gym performance, revenue, memberships, attendance, and expenses.
          </p>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center rounded-card border border-line bg-card px-6 py-16 text-center">
          <p className="text-sm font-semibold text-ink">Couldn&apos;t load report data</p>
          <p className="mt-1 max-w-md text-sm text-subtle">{error}</p>
          <Button variant="primary" size="md" className="mt-4" onClick={() => load("initial")}>
            <RefreshCw className="size-4" strokeWidth={2} aria-hidden />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="animate-fade-up">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
            Reports &amp; Analytics
          </h1>
          <p className="mt-1.5 text-sm text-subtle">
            Track gym performance, revenue, memberships, attendance, and expenses.
          </p>
        </div>
        <div
          className="no-print animate-fade-up flex flex-wrap gap-2.5"
          style={{ animationDelay: "80ms" }}
        >
          {tab !== "attendance" && (
            <ActionMenu
              label="Export report"
              align="right"
              items={[
                {
                  label: "Export CSV",
                  icon: Download,
                  onSelect: exportCsv,
                  disabled: exportRows.length === 0,
                },
                { label: "Print report", icon: Printer, onSelect: printReport },
              ]}
            />
          )}
          <Button
            variant="ghost"
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
        </div>
      </div>

      {/* Filters */}
      <div
        className="no-print animate-fade-up mt-6 grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap"
        style={{ animationDelay: "120ms" }}
      >
        <div className="col-span-2 w-full sm:col-span-1 sm:w-44">
          <Label htmlFor="report-range">Date range</Label>
          <Select
            id="report-range"
            className="mt-1.5"
            value={range}
            onChange={(event) => setRange(event.target.value as ReportRange)}
          >
            {REPORT_RANGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        {range === "custom" && (
          <>
            <div className="col-span-1 w-full sm:w-40">
              <Label htmlFor="report-from">From</Label>
              <Input
                id="report-from"
                type="date"
                className="mt-1.5"
                value={customFrom}
                max={customTo}
                onChange={(event) => setCustomFrom(event.target.value)}
              />
            </div>
            <div className="col-span-1 w-full sm:w-40">
              <Label htmlFor="report-to">To</Label>
              <Input
                id="report-to"
                type="date"
                className="mt-1.5"
                value={customTo}
                min={customFrom}
                onChange={(event) => setCustomTo(event.target.value)}
              />
            </div>
          </>
        )}

        <span className="col-span-2 inline-flex h-9 items-center text-xs text-faint sm:col-span-1">
          {windowText}
        </span>
      </div>

      {/* KPIs */}
      <ReportKpiCards kpis={kpis} loading={status === "loading"} periodLabel={periodLabel} />

      {/* Tabs */}
      <div
        className="no-print mt-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Report types"
      >
        {TABS.map((item) => {
          const Icon = item.icon;
          const selected = tab === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.value)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors",
                selected
                  ? "gold-surface text-[#1A1503] font-semibold shadow-gold"
                  : "border border-line bg-card text-subtle hover:bg-card-hover hover:text-ink",
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} aria-hidden />
              {item.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="mt-5">
        {tab === "revenue" && (
          <RevenuePanel
            loading={status === "loading"}
            windowText={windowText}
            trend={revenueTrend}
            methodSummary={methodSummary}
            payments={rangedPayments}
            onFilteredRowsChange={setExportRows}
          />
        )}
        {tab === "expenses" && (
          <ExpensesPanel
            loading={status === "loading"}
            windowText={windowText}
            trend={expenseTrend}
            slices={categorySlices}
            modeSlices={modeSlices}
            expenses={rangedExpenses}
            onFilteredRowsChange={setExportRows}
          />
        )}
        {tab === "memberships" && (
          <MembershipsPanel
            loading={status === "loading"}
            windowText={windowText}
            report={membershipReport}
            subscriptions={startedSubscriptions}
            onFilteredRowsChange={setExportRows}
          />
        )}
        {tab === "attendance" && <AttendancePanel onOpenTracking={() => router.push("/attendance")} />}
      </div>
    </div>
  );
}

/* -- Panels ----------------------------------------------------------------- */

type PanelProps = {
  loading: boolean;
  windowText: string;
  onFilteredRowsChange: (rows: (PaymentRow | ExpenseRow | SubscriptionRow)[]) => void;
};

function RevenuePanel({
  loading,
  windowText,
  trend,
  methodSummary,
  payments,
  onFilteredRowsChange,
}: PanelProps & {
  trend: { points: { key: string; label: string; totalPaise: number; count: number }[]; granularity: TrendGranularity };
  methodSummary: { collectedPaise: number; count: number; byMode: { mode: string; label: string; count: number; totalPaise: number }[] };
  payments: PaymentRow[];
}) {
  const empty = !loading && payments.length === 0;
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <DashboardCard
          title="Collections over time"
          subtitle={`${GRANULARITY_LABEL[trend.granularity]} trend · ${windowText}`}
          icon={Banknote}
          delay={40}
          className="h-full"
        >
          {loading ? (
            <div className="mt-5 h-[280px] animate-pulse rounded-xl bg-card-hover/50" />
          ) : empty ? (
            <EmptyState
              title="No collections in this period"
              body="Successful payments recorded in the selected range will appear here."
            />
          ) : (
            <div className="mt-5">
              <RevenueTrendChart points={trend.points} granularity={trend.granularity} />
            </div>
          )}
        </DashboardCard>
      </div>

      <DashboardCard
        title="Collections by method"
        subtitle={`${formatNumber(methodSummary.count)} successful payments`}
        icon={Banknote}
        delay={80}
        className="h-full"
      >
        {loading ? (
          <div className="mt-5 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded-lg bg-card-hover/50" />
            ))}
          </div>
        ) : empty ? (
          <EmptyState
            title="No method data"
            body="Payment-method totals will appear once collections are recorded."
          />
        ) : (
          <SplitList
            items={methodSummary.byMode.map((item) => ({
              label: item.label,
              detail: `${formatNumber(item.count)} payments`,
              value: formatCurrencyInr(paiseToAmount(item.totalPaise)),
              pct:
                methodSummary.collectedPaise > 0
                  ? (item.totalPaise / methodSummary.collectedPaise) * 100
                  : 0,
            }))}
            totalLabel="Total collected"
            totalValue={formatCurrencyInr(paiseToAmount(methodSummary.collectedPaise))}
          />
        )}
      </DashboardCard>

      <div className="xl:col-span-3">
        <DashboardCard
          title="Collection records"
          subtitle={`${formatNumber(payments.length)} payments · ${windowText}`}
          icon={Banknote}
          delay={100}
        >
          <ReportDetailsTable
            key={`revenue-${windowText}`}
            tab="revenue"
            payments={payments}
            expenses={EMPTY_EXPENSES}
            subscriptions={EMPTY_SUBSCRIPTIONS}
            loading={loading}
            windowLabel={windowText.toLowerCase()}
            onFilteredRowsChange={onFilteredRowsChange}
          />
        </DashboardCard>
      </div>
    </div>
  );
}

function ExpensesPanel({
  loading,
  windowText,
  trend,
  slices,
  modeSlices,
  expenses,
  onFilteredRowsChange,
}: PanelProps & {
  trend: { points: { key: string; label: string; totalPaise: number; count: number }[]; granularity: TrendGranularity };
  slices: { category: string; totalPaise: number; count: number; share: number }[];
  modeSlices: { mode: string; count: number; totalPaise: number; share: number }[];
  expenses: ExpenseRow[];
}) {
  const empty = !loading && expenses.length === 0;
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <DashboardCard
          title="Spend over time"
          subtitle={`${GRANULARITY_LABEL[trend.granularity]} trend · ${windowText}`}
          icon={PiggyBank}
          delay={40}
          className="h-full"
        >
          {loading ? (
            <div className="mt-5 h-[280px] animate-pulse rounded-xl bg-card-hover/50" />
          ) : empty ? (
            <EmptyState
              title="No expenses in this period"
              body="Expenses recorded in the selected range will appear here."
            />
          ) : (
            <div className="mt-5">
              <ExpenseTrendChart points={trend.points} granularity={trend.granularity} />
            </div>
          )}
        </DashboardCard>
      </div>

      <DashboardCard
        title="Spend by category"
        subtitle="Share of spend in the selected period"
        icon={PiggyBank}
        delay={80}
        className="h-full"
      >
        {loading ? (
          <div className="mt-5 h-[280px] animate-pulse rounded-xl bg-card-hover/50" />
        ) : empty ? (
          <EmptyState
            title="No categories to show"
            body="Category totals will appear once expenses are recorded."
          />
        ) : (
          <div className="mt-5">
            <ExpenseCategoryDonut slices={slices} />
          </div>
        )}
      </DashboardCard>

      {modeSlices.length > 0 && (
        <div className="xl:col-span-3">
          <DashboardCard
            title="Spend by payment mode"
            subtitle="Only records that carry a stored payment mode"
            icon={PiggyBank}
            delay={100}
          >
            <SplitList
              items={modeSlices.map((item) => ({
                label: item.mode,
                detail: `${formatNumber(item.count)} records`,
                value: formatCurrencyInr(paiseToAmount(item.totalPaise)),
                pct: item.share,
              }))}
              columns
            />
          </DashboardCard>
        </div>
      )}

      <div className="xl:col-span-3">
        <DashboardCard
          title="Expense records"
          subtitle={`${formatNumber(expenses.length)} expenses · ${windowText}`}
          icon={PiggyBank}
          delay={120}
        >
          <ReportDetailsTable
            key={`expenses-${windowText}`}
            tab="expenses"
            payments={EMPTY_PAYMENTS}
            expenses={expenses}
            subscriptions={EMPTY_SUBSCRIPTIONS}
            loading={loading}
            windowLabel={windowText.toLowerCase()}
            onFilteredRowsChange={onFilteredRowsChange}
          />
        </DashboardCard>
      </div>
    </div>
  );
}

function MembershipsPanel({
  loading,
  windowText,
  report,
  subscriptions,
  onFilteredRowsChange,
}: PanelProps & {
  report: {
    active: number;
    expiring: number;
    expired: number;
    frozen: number;
    cancelled: number;
    inactive: number;
    startedInRange: number;
    renewedInRange: number;
    planMix: { plan: string; count: number; share: number }[];
  };
  subscriptions: SubscriptionRow[];
}) {
  const miniStats: { label: string; value: string; helper: string; icon: LucideIcon }[] = [
    {
      label: "Active now",
      value: formatNumber(report.active + report.expiring),
      helper: "Active + expiring subscriptions",
      icon: Users,
    },
    {
      label: "Started",
      value: formatNumber(report.startedInRange),
      helper: `Terms begun ${windowText.toLowerCase()}`,
      icon: UserPlus,
    },
    {
      label: "Renewed",
      value: formatNumber(report.renewedInRange),
      helper: "Started by returning members",
      icon: RefreshCw,
    },
    {
      label: "Expired",
      value: formatNumber(report.expired),
      helper: "Expired subscriptions on record",
      icon: CircleAlert,
    },
  ];

  const statusRows: { label: string; count: number; tone: "success" | "warning" | "danger" | "neutral" | "muted" }[] = [
    { label: "Active", count: report.active, tone: "success" },
    { label: "Expiring", count: report.expiring, tone: "warning" },
    { label: "Expired", count: report.expired, tone: "danger" },
    { label: "Frozen", count: report.frozen, tone: "neutral" },
    { label: "Cancelled", count: report.cancelled, tone: "muted" },
    { label: "Inactive", count: report.inactive, tone: "muted" },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:col-span-2 xl:grid-cols-4">
        {miniStats.map((stat, index) => (
          <MiniStat key={stat.label} stat={stat} delay={index * 50} loading={loading} />
        ))}
      </div>

      <DashboardCard
        title="Status breakdown"
        subtitle="All subscriptions on record"
        icon={Users}
        delay={80}
        className="h-full"
      >
        {loading ? (
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-8 animate-pulse rounded-lg bg-card-hover/50" />
            ))}
          </div>
        ) : (
          <ul className="mt-5 space-y-2.5">
            {statusRows.map((row) => (
              <li key={row.label} className="flex items-center gap-2.5">
                <Badge tone={row.tone} dot className="min-w-[92px] justify-center">
                  {row.label}
                </Badge>
                <span className="flex-1 text-[13px] tabular-nums text-subtle">
                  {formatNumber(row.count)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>

      <div className="xl:col-span-2">
        <DashboardCard
          title="Membership records"
          subtitle={`${formatNumber(subscriptions.length)} started · ${windowText}`}
          icon={Dumbbell}
          delay={100}
          className="h-full"
        >
          <ReportDetailsTable
            key={`memberships-${windowText}`}
            tab="memberships"
            payments={EMPTY_PAYMENTS}
            expenses={EMPTY_EXPENSES}
            subscriptions={subscriptions}
            loading={loading}
            windowLabel={windowText.toLowerCase()}
            onFilteredRowsChange={onFilteredRowsChange}
          />
        </DashboardCard>
      </div>

      <DashboardCard
        title="Plan distribution"
        subtitle="Active + expiring mix right now"
        icon={Dumbbell}
        delay={120}
        className="h-full"
      >
        {loading ? (
          <div className="mt-5 h-[280px] animate-pulse rounded-xl bg-card-hover/50" />
        ) : report.planMix.length === 0 ? (
          <EmptyState
            title="No active plans to show"
            body="Plan totals will appear once subscriptions are active."
          />
        ) : (
          <div className="mt-5">
            <PlanMixDonut slices={report.planMix} />
          </div>
        )}
      </DashboardCard>
    </div>
  );
}

function AttendancePanel({ onOpenTracking }: { onOpenTracking: () => void }) {
  return (
    <DashboardCard
      title="Attendance report"
      subtitle="Unavailable — no attendance records API"
      icon={CalendarCheck}
      delay={40}
    >
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-card-hover text-faint ring-1 ring-inset ring-line">
          <Info className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="mt-4 text-sm font-semibold text-ink">Attendance reporting isn&apos;t available yet</p>
        <p className="mt-1 max-w-md text-sm leading-relaxed text-subtle">
          The backend doesn&apos;t expose attendance records, so check-ins, attendance
          rates, peak days, and timing splits can&apos;t be reported. Nothing here is
          estimated or inferred from memberships.
        </p>
        <Button variant="secondary" size="md" className="mt-4" onClick={onOpenTracking}>
          <CalendarCheck className="size-4" strokeWidth={1.75} aria-hidden />
          Open attendance tracking
        </Button>
      </div>
    </DashboardCard>
  );
}

/* -- Local pieces ----------------------------------------------------------- */

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-subtle">{body}</p>
    </div>
  );
}

function MiniStat({
  stat,
  delay,
  loading,
}: {
  stat: { label: string; value: string; helper: string; icon: LucideIcon };
  delay: number;
  loading: boolean;
}) {
  const Icon = stat.icon;
  return (
    <section
      style={{ animationDelay: `${delay}ms` }}
      className="animate-fade-up flex flex-col rounded-card border border-line bg-card p-4 shadow-card"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-faint">{stat.label}</p>
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-card-hover text-subtle ring-1 ring-inset ring-line">
          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      {loading ? (
        <div className="mt-3 h-6 w-16 animate-pulse rounded-md bg-card-hover/60" />
      ) : (
        <p className="mt-3 text-[22px] leading-none font-bold tracking-tight text-ink tabular-nums">
          {stat.value}
        </p>
      )}
      <p className="mt-1.5 truncate text-[11px] text-faint">{stat.helper}</p>
    </section>
  );
}

function SplitList({
  items,
  totalLabel,
  totalValue,
  columns = false,
}: {
  items: { label: string; detail: string; value: string; pct: number }[];
  totalLabel?: string;
  totalValue?: string;
  columns?: boolean;
}) {
  const max = Math.max(1, ...items.map((item) => item.pct));
  return (
    <div className={columns ? "mt-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2" : "mt-5 space-y-4"}>
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-[13px] font-medium text-ink">{item.label}</span>
            <span className="shrink-0 text-[13px] font-semibold tabular-nums text-ink">
              {item.value}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-card-hover">
            <div
              className="h-full rounded-full bg-gold"
              style={{ width: `${Math.max(4, (item.pct / max) * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-faint">{item.detail}</p>
        </div>
      ))}
      {totalLabel && totalValue && (
        <div className="flex items-center justify-between gap-3 border-t border-line/60 pt-4">
          <span className="text-xs font-medium text-subtle">{totalLabel}</span>
          <span className="text-sm font-bold tabular-nums text-gold">{totalValue}</span>
        </div>
      )}
    </div>
  );
}
