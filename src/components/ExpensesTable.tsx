"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Copy,
  Eye,
  Pencil,
  RefreshCw,
  Trash,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrencyInr, formatShortDate } from "@/lib/format";
import { paiseToAmount } from "@/lib/members-api";
import type { ExpenseRow } from "@/lib/expenses-view";
import { ActionMenu, type ActionMenuItem } from "./ActionMenu";
import { ExpenseCategoryBadge } from "./ExpenseCategoryBadge";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";

export type ExpensesSortKey = "title" | "category" | "amount" | "date";
export type SortDir = "asc" | "desc";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function compareExpenses(
  a: ExpenseRow,
  b: ExpenseRow,
  key: ExpensesSortKey,
): number {
  switch (key) {
    case "title":
      return a.title.localeCompare(b.title);
    case "category":
      return a.category.localeCompare(b.category);
    case "amount":
      return a.amountPaise - b.amountPaise;
    case "date":
    default:
      return new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime();
  }
}

type ExpensesTableProps = {
  rows: ExpenseRow[];
  totalCount: number;
  page: number;
  pageCount: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  empty: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  noResults: boolean;
  onClearFilters: () => void;
  onAdd: () => void;
  sortKey: ExpensesSortKey;
  sortDir: SortDir;
  onToggleSort: (key: ExpensesSortKey) => void;
  onPageChange: (page: number) => void;
  onView: (row: ExpenseRow) => void;
  onEdit: (row: ExpenseRow) => void;
  onDelete: (row: ExpenseRow) => void;
  onCopy: (row: ExpenseRow) => void;
};

function actionItems(
  row: ExpenseRow,
  handlers: Pick<ExpensesTableProps, "onView" | "onEdit" | "onDelete" | "onCopy">,
): ActionMenuItem[] {
  return [
    { label: "View details", icon: Eye, onSelect: () => handlers.onView(row) },
    { label: "Edit expense", icon: Pencil, onSelect: () => handlers.onEdit(row) },
    { label: "Copy details", icon: Copy, onSelect: () => handlers.onCopy(row) },
    {
      label: "Delete expense",
      icon: Trash,
      danger: true,
      onSelect: () => handlers.onDelete(row),
    },
  ];
}

export function ExpensesTable({
  rows,
  totalCount,
  page,
  pageCount,
  pageSize,
  onPageSizeChange,
  loading,
  error,
  onRetry,
  empty,
  emptyTitle = "No expenses recorded",
  emptyDescription = "Add an expense to start tracking your operating costs.",
  noResults,
  onClearFilters,
  onAdd,
  sortKey,
  sortDir,
  onToggleSort,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onCopy,
}: ExpensesTableProps) {
  const handlers = { onView, onEdit, onDelete, onCopy };

  if (loading) {
    return (
      <div className="mt-5 space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-14 animate-pulse rounded-xl border border-line/70 bg-card-hover/40"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-semibold text-ink">Couldn&apos;t load expenses</p>
        <p className="mt-1 max-w-md text-sm text-subtle">{error}</p>
        <Button variant="primary" size="md" className="mt-4" onClick={onRetry}>
          <RefreshCw className="size-4" strokeWidth={2} aria-hidden />
          Try again
        </Button>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold/10 text-gold ring-1 ring-inset ring-gold/20">
          <Wallet className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="mt-4 text-sm font-semibold text-ink">{emptyTitle}</p>
        <p className="mt-1 max-w-sm text-sm text-subtle">{emptyDescription}</p>
        <Button variant="primary" size="md" className="mt-4" onClick={onAdd}>
          Add expense
        </Button>
      </div>
    );
  }

  if (noResults) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium text-ink">No matching expenses</p>
        <p className="mt-1 text-sm text-subtle">Try adjusting your search or filters.</p>
        <Button variant="secondary" size="md" className="mt-4" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    );
  }

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(rangeStart + rows.length - 1, totalCount);

  return (
    <>
      {/* Desktop table */}
      <div className="mt-5 hidden overflow-x-auto rounded-xl border border-line/80 lg:block">
        <table className="w-full min-w-[1080px] divide-y divide-line/60">
          <thead>
            <tr className="bg-card-hover/40">
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                ID
              </th>
              <SortHeader label="Title" sortKey="title" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <SortHeader label="Category" sortKey="category" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <SortHeader label="Amount" sortKey="amount" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <SortHeader label="Expense Date" sortKey="date" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                Notes
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                Created
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40 bg-card/60">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-card-hover/60">
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="font-mono text-[12px] font-medium text-faint">
                    #{row.id}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="max-w-[220px] truncate text-sm font-medium text-ink" title={row.title}>
                    {row.title}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <ExpenseCategoryBadge category={row.category} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold tabular-nums text-ink">
                  {formatCurrencyInr(paiseToAmount(row.amountPaise))}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-subtle">
                  {formatShortDate(row.dateKey)}
                </td>
                <td className="px-4 py-3">
                  {row.notes ? (
                    <span
                      className="block max-w-[220px] truncate text-xs text-subtle"
                      title={row.notes}
                    >
                      {row.notes}
                    </span>
                  ) : (
                    <span className="text-xs text-faint">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-faint">
                  {row.createdAt ? formatShortDate(row.createdAt.slice(0, 10)) : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(row)}
                      aria-label={`View expense #${row.id}`}
                    >
                      <Eye className="size-3.5" strokeWidth={1.75} aria-hidden />
                      View
                    </Button>
                    <ActionMenu
                      label={`Actions for expense #${row.id}`}
                      items={actionItems(row, handlers)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="mt-5 space-y-3 lg:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-xl border border-line bg-card/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{row.title}</p>
                <p className="mt-0.5 font-mono text-[11px] text-faint">#{row.id}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-gold">
                {formatCurrencyInr(paiseToAmount(row.amountPaise))}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ExpenseCategoryBadge category={row.category} />
              <span className="text-[11px] text-faint">
                {formatShortDate(row.dateKey)}
              </span>
            </div>

            {row.notes && (
              <p className="mt-3 border-t border-line/50 pt-3 text-xs text-subtle">
                {row.notes}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/50 pt-3">
              <Button variant="secondary" size="sm" onClick={() => onView(row)}>
                <Eye className="size-3.5" strokeWidth={1.75} aria-hidden />
                View
              </Button>
              <ActionMenu
                label={`Actions for expense #${row.id}`}
                items={actionItems(row, handlers)}
              />
            </div>
          </li>
        ))}
      </ul>

      {totalCount > 0 && (
        <div className="mt-4 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-3">
            <p className="text-xs text-faint">
              Showing{" "}
              <span className="font-medium tabular-nums text-subtle">
                {rangeStart}–{rangeEnd}
              </span>{" "}
              of <span className="font-medium tabular-nums text-subtle">{totalCount}</span>
            </p>
            <label className="flex items-center gap-2 text-xs text-faint">
              <span className="sr-only">Rows per page</span>
              <Select
                value={String(pageSize)}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                aria-label="Rows per page"
                className="h-8 w-[86px] text-xs"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} / page
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-3.5" strokeWidth={2} aria-hidden />
              Prev
            </Button>
            <span className="text-xs tabular-nums text-subtle">
              Page {page} of {pageCount}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              Next
              <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </>
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
  sortKey: ExpensesSortKey;
  active: ExpensesSortKey;
  dir: SortDir;
  onSort: (key: ExpensesSortKey) => void;
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
