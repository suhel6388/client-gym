"use client";

import {
  CalendarDays,
  ChartColumn,
  ChartPie,
  Download,
  Plus,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatCurrencyInr, formatLongDate, formatNumber } from "@/lib/format";
import { todayKey } from "@/lib/date-window";
import { paiseToAmount } from "@/lib/members-api";
import { deleteExpense, listExpenses, type ExpenseDto } from "@/lib/api";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_PERIODS,
  buildTrendSeries,
  categoryBreakdown,
  expensesWindow,
  previousWindow,
  summarizeExpenses,
  toExpenseRows,
  totalInWindow,
  windowLabel,
  type ExpenseRow,
  type ExpensesPeriod,
} from "@/lib/expenses-view";
import { ConfirmDialog } from "./ConfirmDialog";
import { DashboardCard } from "./DashboardCard";
import {
  ExpenseStatsCards,
  type PeriodComparison,
} from "./ExpenseStatsCards";
import { ExpenseFilters } from "./ExpenseFilters";
import {
  compareExpenses,
  ExpensesTable,
  type ExpensesSortKey,
  type SortDir,
} from "./ExpensesTable";
import { ExpenseFormDrawer } from "./ExpenseFormDrawer";
import { ExpenseDetailsDrawer } from "./ExpenseDetailsDrawer";
import { ExpenseCategoryDonut } from "./charts/ExpenseCategoryDonut";
import { ExpenseTrendChart } from "./charts/ExpenseTrendChart";
import { useToast } from "./providers/ToastProvider";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";

const GRANULARITY_LABEL: Record<string, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
};

export function ExpensesPage() {
  const toast = useToast();

  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Period window
  const [period, setPeriod] = useState<ExpensesPeriod>("month");
  const [anchorDate, setAnchorDate] = useState(todayKey());
  const [customFrom, setCustomFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().slice(0, 10);
  });
  const [customTo, setCustomTo] = useState(todayKey());

  // Table filters
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortKey, setSortKey] = useState<ExpensesSortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Overlays
  const [form, setForm] = useState<{ open: boolean; editing: ExpenseRow | null }>({
    open: false,
    editing: null,
  });
  const [details, setDetails] = useState<ExpenseRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "initial") {
        setStatus("loading");
        setError(null);
      } else {
        setRefreshing(true);
      }
      try {
        const data = await listExpenses();
        setExpenses(data);
        setStatus("ready");
      } catch (caught) {
        const message =
          caught instanceof ApiError
            ? caught.message
            : "Couldn't load expenses. Please try again.";
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

  const rows = useMemo(() => toExpenseRows(expenses), [expenses]);
  const today = useMemo(() => todayKey(), []);

  const window = useMemo(
    () => expensesWindow(period, anchorDate, { from: customFrom, to: customTo }),
    [period, anchorDate, customFrom, customTo],
  );

  const periodLabel =
    EXPENSE_PERIODS.find((option) => option.value === period)?.label ?? "This Month";
  const windowText = windowLabel(window);

  const rangedRows = useMemo(
    () => rows.filter((row) => {
      if (window.from && row.dateKey < window.from) return false;
      if (window.to && row.dateKey > window.to) return false;
      return true;
    }),
    [rows, window],
  );

  const summary = useMemo(() => summarizeExpenses(rows, window, today), [rows, window, today]);

  const comparison = useMemo<PeriodComparison | null>(() => {
    const prev = previousWindow(period, anchorDate, { from: customFrom, to: customTo });
    if (!prev) return null;
    const previousPaise = totalInWindow(rows, prev);
    const deltaPct =
      previousPaise > 0
        ? ((summary.totalPaise - previousPaise) / previousPaise) * 100
        : summary.totalPaise > 0
          ? null
          : 0;
    return { previousPaise, deltaPct };
  }, [period, anchorDate, customFrom, customTo, rows, summary.totalPaise]);

  const trend = useMemo(() => buildTrendSeries(rangedRows, window, today), [rangedRows, window, today]);
  const slices = useMemo(() => categoryBreakdown(rangedRows), [rangedRows]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const category of EXPENSE_CATEGORIES) set.add(category);
    for (const row of rows) set.add(row.category);
    return [...set].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const minPaise =
      minAmount.trim() && Number.isFinite(Number(minAmount))
        ? Math.round(Number(minAmount) * 100)
        : null;
    const maxPaise =
      maxAmount.trim() && Number.isFinite(Number(maxAmount))
        ? Math.round(Number(maxAmount) * 100)
        : null;

    return rangedRows.filter((row) => {
      const matchesQuery =
        !term ||
        `${row.title} ${row.notes ?? ""}`.toLowerCase().includes(term);
      const matchesCategory = categoryFilter === "All" || row.category === categoryFilter;
      const matchesMin = minPaise === null || row.amountPaise >= minPaise;
      const matchesMax = maxPaise === null || row.amountPaise <= maxPaise;
      return matchesQuery && matchesCategory && matchesMin && matchesMax;
    });
  }, [rangedRows, query, categoryFilter, minAmount, maxAmount]);

  const sorted = useMemo(() => {
    const direction = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => compareExpenses(a, b, sortKey) * direction);
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [
    query,
    categoryFilter,
    minAmount,
    maxAmount,
    sortKey,
    sortDir,
    window.from,
    window.to,
    pageSize,
  ]);

  const filtersActive =
    query.trim() !== "" ||
    categoryFilter !== "All" ||
    minAmount.trim() !== "" ||
    maxAmount.trim() !== "";

  const clearFilters = () => {
    setQuery("");
    setCategoryFilter("All");
    setMinAmount("");
    setMaxAmount("");
  };

  const toggleSort = (key: ExpensesSortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const openAdd = () => setForm({ open: true, editing: null });
  const openEdit = (row: ExpenseRow) => {
    setDetails(null);
    setForm({ open: true, editing: row });
  };

  const copyDetails = useCallback(
    async (row: ExpenseRow) => {
      const lines = [
        `Expense #${row.id}`,
        `Title: ${row.title}`,
        `Category: ${row.category}`,
        `Amount: ${formatCurrencyInr(paiseToAmount(row.amountPaise))}`,
        `Date: ${formatLongDate(row.dateKey)}`,
        row.notes ? `Notes: ${row.notes}` : null,
      ].filter(Boolean);
      try {
        await navigator.clipboard.writeText(lines.join("\n"));
        toast.success("Copied", "Expense details copied to clipboard.");
      } catch {
        toast.error("Couldn't copy", "Your browser blocked clipboard access.");
      }
    },
    [toast],
  );

  const confirmDelete = (row: ExpenseRow) => setDeleteTarget(row);

  const doDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await toast.promise(deleteExpense(deleteTarget.id), {
        loading: {
          title: "Deleting expense…",
          description: `Removing "${deleteTarget.title}" from your books.`,
        },
        success: {
          title: "Expense deleted",
          description: `"${deleteTarget.title}" was removed.`,
        },
        error: (caught) => ({
          title: "Couldn't delete expense",
          description:
            caught instanceof ApiError ? caught.message : "Please try again.",
        }),
      });
      setDeleteTarget(null);
      setDetails(null);
      await load("refresh");
    } catch {
      // The toast explains the failure; close the dialog so it can be retried.
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, load, toast]);

  const exportCsv = () => {
    const header = ["ID", "Title", "Category", "Amount", "Expense Date", "Notes", "Created"];
    const lines = sorted.map((row) => [
      String(row.id),
      row.title,
      row.category,
      (row.amountPaise / 100).toFixed(2),
      row.dateKey,
      row.notes ?? "",
      row.createdAt ? row.createdAt.slice(0, 10) : "",
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
    anchor.download = `expenses-${window.from ?? "all"}_${window.to ?? "all"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Export ready", `${sorted.length} expense(s) exported to CSV.`);
  };

  const showEmpty = status === "ready" && rangedRows.length === 0;
  const showNoResults = status === "ready" && rangedRows.length > 0 && filtered.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="animate-fade-up">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
            Expense Management
          </h1>
          <p className="mt-1.5 text-sm text-subtle">
            Track gym operating costs, equipment maintenance, utilities, and other
            expenses.
          </p>
        </div>
        <div
          className="animate-fade-up flex flex-wrap gap-2.5"
          style={{ animationDelay: "80ms" }}
        >
          <Button variant="secondary" size="md" onClick={exportCsv} disabled={sorted.length === 0}>
            <Download className="size-4" strokeWidth={1.75} aria-hidden />
            Export Report
          </Button>
          <Button variant="primary" size="md" onClick={openAdd}>
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Period controls */}
      <div
        className="animate-fade-up mt-6 flex flex-wrap items-end gap-3"
        style={{ animationDelay: "120ms" }}
      >
        <div className="w-40">
          <Label htmlFor="expense-period">Period</Label>
          <Select
            id="expense-period"
            className="mt-1.5"
            value={period}
            onChange={(event) => {
              const next = event.target.value as ExpensesPeriod;
              setPeriod(next);
              if (next !== "custom") setAnchorDate(todayKey());
            }}
          >
            {EXPENSE_PERIODS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        {period === "custom" ? (
          <>
            <div className="w-40">
              <Label htmlFor="expense-from">From</Label>
              <Input
                id="expense-from"
                type="date"
                className="mt-1.5"
                value={customFrom}
                max={customTo}
                onChange={(event) => setCustomFrom(event.target.value)}
              />
            </div>
            <div className="w-40">
              <Label htmlFor="expense-to">To</Label>
              <Input
                id="expense-to"
                type="date"
                className="mt-1.5"
                value={customTo}
                min={customFrom}
                max={today}
                onChange={(event) => setCustomTo(event.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="w-40">
            <Label htmlFor="expense-anchor">Date</Label>
            <Input
              id="expense-anchor"
              type="date"
              className="mt-1.5"
              value={anchorDate}
              max={today}
              onChange={(event) => setAnchorDate(event.target.value)}
            />
          </div>
        )}

        <span className="inline-flex h-9 items-center gap-1.5 text-xs text-faint">
          <CalendarDays className="size-3.5" strokeWidth={1.75} aria-hidden />
          {windowText}
        </span>

        <Button
          variant="ghost"
          size="md"
          className="ml-auto"
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
      <ExpenseStatsCards
        summary={summary}
        comparison={comparison}
        loading={status === "loading"}
        periodLabel={periodLabel}
      />

      {/* Analytics */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3 lg:mt-6">
        <DashboardCard
          title="Expense Overview"
          subtitle={`${GRANULARITY_LABEL[trend.granularity]} trend · ${windowText}`}
          icon={ChartColumn}
          delay={40}
          className="h-full xl:col-span-2"
        >
          {status === "loading" ? (
            <div className="mt-5 h-[280px] animate-pulse rounded-xl bg-card-hover/50" />
          ) : rangedRows.length === 0 ? (
            <div className="mt-6 flex h-[280px] flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-ink">No expense data for this period</p>
              <p className="mt-1 text-xs text-subtle">
                Add expenses or widen the date range to see the trend chart.
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <ExpenseTrendChart points={trend.points} granularity={trend.granularity} />
            </div>
          )}
        </DashboardCard>

        <DashboardCard
          title="Expenses by Category"
          subtitle="Share of spend in the selected period"
          icon={ChartPie}
          delay={80}
          className="h-full"
        >
          {status === "loading" ? (
            <div className="mt-5 h-[280px] animate-pulse rounded-xl bg-card-hover/50" />
          ) : rangedRows.length === 0 ? (
            <div className="mt-6 flex h-[280px] flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-ink">No categories to show</p>
              <p className="mt-1 text-xs text-subtle">
                Category totals will appear once expenses are recorded.
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <ExpenseCategoryDonut slices={slices} />
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Records */}
      <div className="mt-5 lg:mt-6">
        <DashboardCard
          title="Expense records"
          subtitle={`${formatNumber(filtered.length)} of ${formatNumber(rangedRows.length)} · ${windowText}`}
          icon={Wallet}
          delay={120}
          className="h-full"
        >
          <ExpenseFilters
            query={query}
            onQueryChange={setQuery}
            categoryFilter={categoryFilter}
            categoryOptions={categoryOptions}
            onCategoryFilterChange={setCategoryFilter}
            minAmount={minAmount}
            onMinAmountChange={setMinAmount}
            maxAmount={maxAmount}
            onMaxAmountChange={setMaxAmount}
            filtersActive={filtersActive}
            onClearFilters={clearFilters}
          />

          <ExpensesTable
            rows={pageRows}
            totalCount={sorted.length}
            page={currentPage}
            pageCount={pageCount}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            loading={status === "loading"}
            error={status === "error" ? error : null}
            onRetry={() => load("initial")}
            empty={showEmpty}
            emptyTitle={
              expenses.length === 0 ? "No expenses recorded" : "No expenses in this period"
            }
            emptyDescription={
              expenses.length === 0
                ? "Add an expense to start tracking your operating costs."
                : `No expenses were recorded ${windowText}.`
            }
            noResults={showNoResults}
            onClearFilters={clearFilters}
            onAdd={openAdd}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleSort={toggleSort}
            onPageChange={setPage}
            onView={setDetails}
            onEdit={openEdit}
            onDelete={confirmDelete}
            onCopy={copyDetails}
          />
        </DashboardCard>
      </div>

      {/* Overlays */}
      <ExpenseFormDrawer
        open={form.open}
        editing={form.editing}
        onOpenChange={(open) => {
          setForm((current) => ({ ...current, open }));
          if (!open) setForm((current) => ({ ...current, editing: null }));
        }}
        onSaved={() => load("refresh")}
      />

      <ExpenseDetailsDrawer
        open={Boolean(details)}
        row={details}
        onOpenChange={(open) => !open && setDetails(null)}
        onEdit={openEdit}
        onDelete={confirmDelete}
        onCopy={copyDetails}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete expense?"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.title}" (${formatCurrencyInr(
                paiseToAmount(deleteTarget.amountPaise),
              )})? This action can't be undone.`
            : undefined
        }
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={doDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}