"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { formatCurrencyInr, formatShortDate } from "@/lib/format";
import { paiseToAmount } from "@/lib/members-api";
import {
  paymentModeTone,
  paymentStatusLabel,
  paymentStatusTone,
  type PaymentRow,
} from "@/lib/payments-view";
import type { ExpenseRow } from "@/lib/expenses-view";
import {
  paymentStatusFor,
  paymentTone,
  subscriptionTone,
  type SubscriptionRow,
} from "@/lib/membership-view";
import { ExpenseCategoryBadge } from "./ExpenseCategoryBadge";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

export type ReportTab = "revenue" | "expenses" | "memberships";

const PAGE_SIZE = 10;

type RevenueSortKey = "date" | "member" | "amount";
type ExpenseSortKey = "date" | "title" | "amount";
type MembershipSortKey = "member" | "end" | "balance";

type ReportDetailsTableProps = {
  tab: ReportTab;
  payments: PaymentRow[];
  expenses: ExpenseRow[];
  subscriptions: SubscriptionRow[];
  loading: boolean;
  windowLabel: string;
  /** Receives the filtered + sorted rows (all pages) for CSV export. */
  onFilteredRowsChange: (rows: (PaymentRow | ExpenseRow | SubscriptionRow)[]) => void;
};

export function ReportDetailsTable({
  tab,
  payments,
  expenses,
  subscriptions,
  loading,
  windowLabel,
  onFilteredRowsChange,
}: ReportDetailsTableProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<string>("date");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setQuery("");
    setSort(tab === "memberships" ? "end" : "date");
    setDir(tab === "memberships" ? "asc" : "desc");
    setPage(1);
  }, [tab]);

  const filtered = useMemo<
    (PaymentRow | ExpenseRow | SubscriptionRow)[]
  >(() => {
    const term = query.trim().toLowerCase();
    if (tab === "revenue") {
      const rows = payments.filter((row) => {
        if (!term) return true;
        return `${row.receiptNumber} ${row.memberName} ${row.memberCode} ${row.reference ?? ""}`
          .toLowerCase()
          .includes(term);
      });
      const direction = dir === "asc" ? 1 : -1;
      return [...rows].sort((a, b) => {
        switch (sort as RevenueSortKey) {
          case "member":
            return a.memberName.localeCompare(b.memberName) * direction;
          case "amount":
            return (a.amountPaise - b.amountPaise) * direction;
          case "date":
          default:
            return (
              (new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()) *
              direction
            );
        }
      });
    }
    if (tab === "expenses") {
      const rows = expenses.filter((row) => {
        if (!term) return true;
        return `${row.title} ${row.notes ?? ""} ${row.category}`
          .toLowerCase()
          .includes(term);
      });
      const direction = dir === "asc" ? 1 : -1;
      return [...rows].sort((a, b) => {
        switch (sort as ExpenseSortKey) {
          case "title":
            return a.title.localeCompare(b.title) * direction;
          case "amount":
            return (a.amountPaise - b.amountPaise) * direction;
          case "date":
          default:
            return (
              (new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime()) *
              direction
            );
        }
      });
    }
    const rows = subscriptions.filter((row) => {
      if (!term) return true;
      return `${row.memberName} ${row.memberCode} ${row.planName}`
        .toLowerCase()
        .includes(term);
    });
    const direction = dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (sort as MembershipSortKey) {
        case "member":
          return a.memberName.localeCompare(b.memberName) * direction;
        case "balance":
          return (a.balancePaise - b.balancePaise) * direction;
        case "end":
        default:
          return (
            (new Date(a.endDate).getTime() - new Date(b.endDate).getTime()) * direction
          );
      }
    });
  }, [tab, payments, expenses, subscriptions, query, sort, dir]);

  useEffect(() => {
    onFilteredRowsChange(filtered);
  }, [filtered, onFilteredRowsChange]);

  useEffect(() => {
    setPage(1);
  }, [query, sort, dir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = (key: string) => {
    if (sort === key) {
      setDir((value) => (value === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setDir(key === "member" || key === "title" ? "asc" : "desc");
    }
  };

  const searchPlaceholder =
    tab === "revenue"
      ? "Search receipt, member, or code…"
      : tab === "expenses"
        ? "Search title, notes, or category…"
        : "Search member, code, or plan…";

  if (loading) {
    return (
      <div className="mt-5 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-14 animate-pulse rounded-xl border border-line/70 bg-card-hover/40"
          />
        ))}
      </div>
    );
  }

  const rangeStart = (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(rangeStart + pageRows.length - 1, filtered.length);

  return (
    <>
      <div className="no-print relative mt-5 lg:max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
          strokeWidth={1.75}
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label="Search report records"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-ink">No records in this period</p>
          <p className="mt-1 max-w-sm text-sm text-subtle">
            {query.trim()
              ? "Try adjusting your search."
              : `Nothing was recorded ${windowLabel}.`}
          </p>
          {query.trim() && (
            <Button variant="secondary" size="md" className="mt-4" onClick={() => setQuery("")}>
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-5 overflow-x-auto rounded-xl border border-line/80">
            {tab === "revenue" && (
              <RevenueGrid
                rows={pageRows as PaymentRow[]}
                sort={sort}
                dir={dir}
                onSort={toggleSort}
              />
            )}
            {tab === "expenses" && (
              <ExpenseGrid
                rows={pageRows as ExpenseRow[]}
                sort={sort}
                dir={dir}
                onSort={toggleSort}
              />
            )}
            {tab === "memberships" && (
              <MembershipGrid
                rows={pageRows as SubscriptionRow[]}
                sort={sort}
                dir={dir}
                onSort={toggleSort}
              />
            )}
          </div>

          <div className="no-print mt-4 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-faint">
              Showing{" "}
              <span className="font-medium tabular-nums text-subtle">
                {rangeStart}–{rangeEnd}
              </span>{" "}
              of{" "}
              <span className="font-medium tabular-nums text-subtle">
                {filtered.length}
              </span>
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
        </>
      )}
    </>
  );
}

/* -- Shared header cell --------------------------------------------------- */

function SortHeader({
  label,
  sortKey,
  active,
  dir,
  onSort,
}: {
  label: string;
  sortKey: string;
  active: string;
  dir: "asc" | "desc";
  onSort: (key: string) => void;
}) {
  const isActive = active === sortKey;
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label}`}
        className={cn("h-6 px-1 text-[11px] font-semibold uppercase tracking-[0.12em]", isActive ? "text-gold" : "text-faint hover:text-ink")}
      >
        {label}
        {isActive ? (
          <span aria-hidden className="text-[9px]">
            {dir === "asc" ? "▲" : "▼"}
          </span>
        ) : (
          <ChevronsUpDown className="size-3 opacity-60" strokeWidth={2} aria-hidden />
        )}
      </Button>
    </th>
  );
}

function StaticHeader({ label }: { label: string }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
      {label}
    </th>
  );
}

/* -- Grids ---------------------------------------------------------------- */

function RevenueGrid({
  rows,
  sort,
  dir,
  onSort,
}: {
  rows: PaymentRow[];
  sort: string;
  dir: "asc" | "desc";
  onSort: (key: string) => void;
}) {
  return (
    <table className="w-full min-w-[860px] divide-y divide-line/60">
      <thead>
        <tr className="bg-card-hover/40">
          <StaticHeader label="Receipt" />
          <SortHeader label="Member" sortKey="member" active={sort} dir={dir} onSort={onSort} />
          <SortHeader label="Amount" sortKey="amount" active={sort} dir={dir} onSort={onSort} />
          <StaticHeader label="Method" />
          <SortHeader label="Date" sortKey="date" active={sort} dir={dir} onSort={onSort} />
          <StaticHeader label="Status" />
        </tr>
      </thead>
      <tbody className="divide-y divide-line/40 bg-card/60">
        {rows.map((row) => (
          <tr key={row.id} className="transition-colors hover:bg-card-hover/60">
            <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] font-medium text-gold-soft">
              {row.receiptNumber}
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Avatar initials={row.memberInitials} className="size-8 text-[10px]" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{row.memberName}</p>
                  <p className="truncate font-mono text-[11px] text-faint">{row.memberCode}</p>
                </div>
              </div>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold tabular-nums text-ink">
              {formatCurrencyInr(paiseToAmount(row.amountPaise))}
            </td>
            <td className="px-4 py-3">
              <Badge tone={paymentModeTone(row.paymentMode)}>{row.modeLabel}</Badge>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-xs text-subtle">
              {formatShortDate(row.dateKey)}
            </td>
            <td className="px-4 py-3">
              <Badge tone={paymentStatusTone(row.status)} dot>
                {paymentStatusLabel(row.status)}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ExpenseGrid({
  rows,
  sort,
  dir,
  onSort,
}: {
  rows: ExpenseRow[];
  sort: string;
  dir: "asc" | "desc";
  onSort: (key: string) => void;
}) {
  return (
    <table className="w-full min-w-[860px] divide-y divide-line/60">
      <thead>
        <tr className="bg-card-hover/40">
          <StaticHeader label="ID" />
          <SortHeader label="Title" sortKey="title" active={sort} dir={dir} onSort={onSort} />
          <StaticHeader label="Category" />
          <SortHeader label="Amount" sortKey="amount" active={sort} dir={dir} onSort={onSort} />
          <SortHeader label="Date" sortKey="date" active={sort} dir={dir} onSort={onSort} />
          <StaticHeader label="Notes" />
        </tr>
      </thead>
      <tbody className="divide-y divide-line/40 bg-card/60">
        {rows.map((row) => (
          <tr key={row.id} className="transition-colors hover:bg-card-hover/60">
            <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] font-medium text-faint">
              #{row.id}
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
                <span className="block max-w-[220px] truncate text-xs text-subtle" title={row.notes}>
                  {row.notes}
                </span>
              ) : (
                <span className="text-xs text-faint">—</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MembershipGrid({
  rows,
  sort,
  dir,
  onSort,
}: {
  rows: SubscriptionRow[];
  sort: string;
  dir: "asc" | "desc";
  onSort: (key: string) => void;
}) {
  return (
    <table className="w-full min-w-[920px] divide-y divide-line/60">
      <thead>
        <tr className="bg-card-hover/40">
          <SortHeader label="Member" sortKey="member" active={sort} dir={dir} onSort={onSort} />
          <StaticHeader label="Plan" />
          <StaticHeader label="Status" />
          <StaticHeader label="Payment" />
          <SortHeader label="Balance" sortKey="balance" active={sort} dir={dir} onSort={onSort} />
          <SortHeader label="Ends" sortKey="end" active={sort} dir={dir} onSort={onSort} />
        </tr>
      </thead>
      <tbody className="divide-y divide-line/40 bg-card/60">
        {rows.map((row) => (
          <tr key={row.id} className="transition-colors hover:bg-card-hover/60">
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Avatar initials={row.memberInitials} className="size-8 text-[10px]" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{row.memberName}</p>
                  <p className="truncate font-mono text-[11px] text-faint">{row.memberCode}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3">
              <Badge tone="gold">{row.planName}</Badge>
            </td>
            <td className="px-4 py-3">
              <Badge tone={subscriptionTone(row.status)} dot>
                {row.status}
              </Badge>
            </td>
            <td className="px-4 py-3">
              <Badge tone={paymentTone(paymentStatusFor(row))}>
                {paymentStatusFor(row)}
              </Badge>
              <p className="mt-1 text-[11px] tabular-nums text-faint">
                {formatCurrencyInr(paiseToAmount(row.paidPaise))} of{" "}
                {formatCurrencyInr(paiseToAmount(row.feePaise))}
              </p>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold tabular-nums text-ink">
              {formatCurrencyInr(paiseToAmount(row.balancePaise))}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-xs text-subtle">
              {formatShortDate(row.endDate.slice(0, 10))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
