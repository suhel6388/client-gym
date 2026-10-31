"use client";

import {
  CalendarDays,
  ChartColumn,
  Download,
  Plus,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  listMembers,
  listPayments,
  paiseToAmount,
  type MemberDto,
  type PaymentDto,
} from "@/lib/members-api";
import {
  PAYMENT_PERIODS,
  inWindow,
  periodWindow,
  summarizePayments,
  toPaymentRows,
  todayKey,
  windowLabel,
  type PaymentRow,
  type PaymentsPeriod,
  type PaymentsSummary,
} from "@/lib/payments-view";
import { DashboardCard } from "./DashboardCard";
import { PaymentDetailsDrawer } from "./PaymentDetailsDrawer";
import { PaymentFormDrawer } from "./PaymentFormDrawer";
import {
  PaymentFilters,
  type PaymentMethodFilter,
} from "./PaymentFilters";
import { PaymentStatsCards } from "./PaymentStatsCards";
import {
  comparePayments,
  PaymentsTable,
  type PaymentsSortKey,
  type SortDir,
} from "./PaymentsTable";
import { useToast } from "./providers/ToastProvider";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";

const PAGE_SIZE = 10;

export function PaymentsPage() {
  const toast = useToast();
  const router = useRouter();

  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Period window
  const [period, setPeriod] = useState<PaymentsPeriod>("month");
  const [anchorDate, setAnchorDate] = useState(todayKey());
  const [customFrom, setCustomFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().slice(0, 10);
  });
  const [customTo, setCustomTo] = useState(todayKey());

  // Table filters
  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<PaymentMethodFilter>("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState<PaymentsSortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  // Overlays
  const [form, setForm] = useState<{ open: boolean; presetMemberId: string | null }>({
    open: false,
    presetMemberId: null,
  });
  const [details, setDetails] = useState<PaymentRow | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "initial") {
        setStatus("loading");
        setError(null);
      } else {
        setRefreshing(true);
      }
      try {
        const [paymentData, memberData] = await Promise.all([
          listPayments(),
          listMembers(),
        ]);
        setPayments(paymentData);
        setMembers(memberData);
        setStatus("ready");
      } catch (caught) {
        const message =
          caught instanceof ApiError
            ? caught.message
            : "Couldn't load payments. Please try again.";
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

  const rows = useMemo(() => toPaymentRows(payments), [payments]);
  const today = todayKey();

  const window = useMemo(
    () => periodWindow(period, anchorDate, { from: customFrom, to: customTo }),
    [period, anchorDate, customFrom, customTo],
  );

  const periodLabel =
    PAYMENT_PERIODS.find((option) => option.value === period)?.label ?? "This Month";
  const windowText = windowLabel(window, "All time");

  const rangedRows = useMemo(
    () => rows.filter((row) => inWindow(row.dateKey, window)),
    [rows, window],
  );

  const summary = useMemo(() => summarizePayments(rangedRows, today), [rangedRows, today]);

  const statusOptions = useMemo(() => {
    const set = new Set(rows.map((row) => row.status).filter(Boolean));
    set.add("SUCCESS");
    return [...set].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rangedRows.filter((row) => {
      const haystack =
        `${row.receiptNumber} ${row.memberName} ${row.memberCode} ${row.reference ?? ""}`.toLowerCase();
      const matchesQuery = !term || haystack.includes(term);
      const matchesMethod = methodFilter === "All" || row.paymentMode === methodFilter;
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      return matchesQuery && matchesMethod && matchesStatus;
    });
  }, [rangedRows, query, methodFilter, statusFilter]);

  const sorted = useMemo(() => {
    const direction = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => comparePayments(a, b, sortKey) * direction);
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, methodFilter, statusFilter, sortKey, sortDir, window.from, window.to]);

  const filtersActive =
    query.trim() !== "" || methodFilter !== "All" || statusFilter !== "All";

  const clearFilters = () => {
    setQuery("");
    setMethodFilter("All");
    setStatusFilter("All");
  };

  const toggleSort = (key: PaymentsSortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const exportCsv = () => {
    const header = [
      "Receipt",
      "Member ID",
      "Member",
      "Amount",
      "Method",
      "Date",
      "Time",
      "Reference",
      "Status",
    ];
    const lines = sorted.map((row) => [
      row.receiptNumber,
      row.memberCode,
      row.memberName,
      (row.amountPaise / 100).toFixed(2),
      row.modeLabel,
      row.dateKey,
      new Date(row.paymentDate).toLocaleTimeString("en-US"),
      row.reference ?? "",
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
    anchor.download = `payments-${window.from ?? "all"}_${window.to ?? today}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Export ready", `${sorted.length} payment(s) exported to CSV.`);
  };

  const openForm = (presetMemberId: string | null = null) =>
    setForm({ open: true, presetMemberId });

  const copyReceipt = useCallback(
    async (receiptNumber: string) => {
      try {
        await navigator.clipboard.writeText(receiptNumber);
        toast.success("Copied", `Receipt ${receiptNumber} copied to clipboard.`);
      } catch {
        toast.error("Couldn't copy", "Your browser blocked clipboard access.");
      }
    },
    [toast],
  );

  const viewMember = useCallback(() => router.push("/members"), [router]);

  const showEmpty = status === "ready" && rangedRows.length === 0;
  const showNoResults = status === "ready" && rangedRows.length > 0 && filtered.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="animate-fade-up">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
            Payment Management
          </h1>
          <p className="mt-1.5 text-sm text-subtle">
            Track collections, payment methods, and transaction history.
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
          <Button variant="primary" size="md" onClick={() => openForm()}>
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Period controls */}
      <div
        className="animate-fade-up mt-6 grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap"
        style={{ animationDelay: "120ms" }}
      >
        <div className="col-span-2 w-full sm:col-span-1 sm:w-40">
          <Label htmlFor="pay-period">Period</Label>
          <Select
            id="pay-period"
            className="mt-1.5"
            value={period}
            onChange={(event) => {
              const next = event.target.value as PaymentsPeriod;
              setPeriod(next);
              if (next !== "custom" && next !== "all") setAnchorDate(todayKey());
            }}
          >
            {PAYMENT_PERIODS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        {period === "custom" ? (
          <>
            <div className="col-span-1 w-full sm:w-40">
              <Label htmlFor="pay-from">From</Label>
              <Input
                id="pay-from"
                type="date"
                className="mt-1.5"
                value={customFrom}
                max={customTo}
                onChange={(event) => setCustomFrom(event.target.value)}
              />
            </div>
            <div className="col-span-1 w-full sm:w-40">
              <Label htmlFor="pay-to">To</Label>
              <Input
                id="pay-to"
                type="date"
                className="mt-1.5"
                value={customTo}
                min={customFrom}
                max={today}
                onChange={(event) => setCustomTo(event.target.value)}
              />
            </div>
          </>
        ) : period !== "all" ? (
          <div className="col-span-2 w-full sm:col-span-1 sm:w-40">
            <Label htmlFor="pay-anchor">Date</Label>
            <Input
              id="pay-anchor"
              type="date"
              className="mt-1.5"
              value={anchorDate}
              max={today}
              onChange={(event) => setAnchorDate(event.target.value)}
            />
          </div>
        ) : null}

        <span className="col-span-2 inline-flex h-9 items-center gap-1.5 text-xs text-faint sm:col-span-1">
          <CalendarDays className="size-3.5" strokeWidth={1.75} aria-hidden />
          {windowText}
        </span>

        <Button
          variant="ghost"
          size="md"
          className="col-span-2 w-full sm:col-span-1 sm:ml-auto sm:w-auto"
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

      {/* Stats */}
      <PaymentStatsCards
        summary={summary}
        loading={status === "loading"}
        periodLabel={periodLabel}
        windowLabel={windowText}
      />

      {/* Records + method breakdown */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3 lg:mt-6">
        <div className="xl:col-span-2">
          <DashboardCard
            title="Payment records"
            subtitle={`${filtered.length} of ${rangedRows.length} payment${
              rangedRows.length === 1 ? "" : "s"
            } · ${windowText}`}
            icon={Wallet}
            delay={40}
            className="h-full"
          >
            <PaymentFilters
              query={query}
              onQueryChange={setQuery}
              methodFilter={methodFilter}
              onMethodFilterChange={setMethodFilter}
              statusFilter={statusFilter}
              statusOptions={statusOptions}
              onStatusFilterChange={setStatusFilter}
              filtersActive={filtersActive}
              onClearFilters={clearFilters}
            />

            <PaymentsTable
              rows={pageRows}
              totalCount={sorted.length}
              page={currentPage}
              pageCount={pageCount}
              pageSize={PAGE_SIZE}
              loading={status === "loading"}
              error={status === "error" ? error : null}
              onRetry={() => load("initial")}
              empty={showEmpty}
              emptyTitle={payments.length === 0 ? "No payments recorded" : "No payments in this period"}
              emptyDescription={
                payments.length === 0
                  ? "Record a payment to start building the collection history."
                  : `No payments were recorded ${windowText.toLowerCase()}.`
              }
              noResults={showNoResults}
              onClearFilters={clearFilters}
              onRecord={() => openForm()}
              sortKey={sortKey}
              sortDir={sortDir}
              onToggleSort={toggleSort}
              onPageChange={setPage}
              onView={setDetails}
              onCopyReceipt={(row) => copyReceipt(row.receiptNumber)}
              onViewMember={viewMember}
            />
          </DashboardCard>
        </div>

        <MethodBreakdown summary={summary} loading={status === "loading"} delay={80} />
      </div>

      {/* Overlays */}
      <PaymentFormDrawer
        open={form.open}
        members={members}
        presetMemberId={form.presetMemberId}
        onOpenChange={(open) => setForm((current) => ({ ...current, open }))}
        onSaved={() => load("refresh")}
      />

      <PaymentDetailsDrawer
        open={Boolean(details)}
        row={details}
        onOpenChange={(open) => !open && setDetails(null)}
        onCopyReceipt={(row) => copyReceipt(row.receiptNumber)}
        onViewMember={viewMember}
      />
    </div>
  );
}

function MethodBreakdown({
  summary,
  loading,
  delay = 0,
}: {
  summary: PaymentsSummary;
  loading: boolean;
  delay?: number;
}) {
  const max = Math.max(1, ...summary.byMode.map((item) => item.totalPaise));

  return (
    <DashboardCard
      title="Collection by method"
      subtitle={`${formatNumber(summary.count)} successful payment${
        summary.count === 1 ? "" : "s"
      }`}
      icon={ChartColumn}
      delay={delay}
      className="h-full"
    >
      {loading ? (
        <div className="mt-5 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-lg bg-card-hover/50" />
          ))}
        </div>
      ) : summary.byMode.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center py-10 text-center">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-card-hover/50 text-faint">
            <Wallet className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="mt-3 text-sm font-medium text-ink">No collections yet</p>
          <p className="mt-1 max-w-xs text-xs text-subtle">
            Totals by payment method will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {summary.byMode.map((item) => (
            <div key={item.mode}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-medium text-ink">{item.label}</span>
                <span className="text-[13px] font-semibold tabular-nums text-ink">
                  {formatCurrency(paiseToAmount(item.totalPaise))}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-card-hover">
                <div
                  className="h-full rounded-full bg-gold"
                  style={{ width: `${Math.max(4, (item.totalPaise / max) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-faint">
                {formatNumber(item.count)} payment{item.count === 1 ? "" : "s"}
              </p>
            </div>
          ))}

          <div className="flex items-center justify-between gap-3 border-t border-line/60 pt-4">
            <span className="text-xs font-medium text-subtle">Total collected</span>
            <span className="text-sm font-bold tabular-nums text-gold">
              {formatCurrency(paiseToAmount(summary.collectedPaise))}
            </span>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
