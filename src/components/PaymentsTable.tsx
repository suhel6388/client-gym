"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Copy,
  Eye,
  RefreshCw,
  UserRound,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { paiseToAmount } from "@/lib/members-api";
import {
  formatTime,
  paymentModeTone,
  paymentStatusLabel,
  paymentStatusTone,
  type PaymentRow,
} from "@/lib/payments-view";
import { ActionMenu, type ActionMenuItem } from "./ActionMenu";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

export type PaymentsSortKey =
  | "receipt"
  | "member"
  | "amount"
  | "method"
  | "date"
  | "status";

export type SortDir = "asc" | "desc";

export function comparePayments(
  a: PaymentRow,
  b: PaymentRow,
  key: PaymentsSortKey,
): number {
  switch (key) {
    case "receipt":
      return a.receiptNumber.localeCompare(b.receiptNumber);
    case "member":
      return a.memberName.localeCompare(b.memberName);
    case "amount":
      return a.amountPaise - b.amountPaise;
    case "method":
      return a.modeLabel.localeCompare(b.modeLabel);
    case "status":
      return a.status.localeCompare(b.status);
    case "date":
    default:
      return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
  }
}

type PaymentsTableProps = {
  rows: PaymentRow[];
  totalCount: number;
  page: number;
  pageCount: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  empty: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  noResults: boolean;
  onClearFilters: () => void;
  onRecord: () => void;
  sortKey: PaymentsSortKey;
  sortDir: SortDir;
  onToggleSort: (key: PaymentsSortKey) => void;
  onPageChange: (page: number) => void;
  onView: (row: PaymentRow) => void;
  onCopyReceipt: (row: PaymentRow) => void;
  onViewMember: (row: PaymentRow) => void;
};

function actionItems(
  row: PaymentRow,
  handlers: Pick<
    PaymentsTableProps,
    "onView" | "onCopyReceipt" | "onViewMember"
  >,
): ActionMenuItem[] {
  return [
    { label: "View receipt", icon: Eye, onSelect: () => handlers.onView(row) },
    {
      label: "Copy receipt number",
      icon: Copy,
      onSelect: () => handlers.onCopyReceipt(row),
    },
    {
      label: "View member profile",
      icon: UserRound,
      onSelect: () => handlers.onViewMember(row),
    },
  ];
}

export function PaymentsTable({
  rows,
  totalCount,
  page,
  pageCount,
  pageSize,
  loading,
  error,
  onRetry,
  empty,
  emptyTitle = "No payments recorded",
  emptyDescription = "Record a payment to start building the collection history.",
  noResults,
  onClearFilters,
  onRecord,
  sortKey,
  sortDir,
  onToggleSort,
  onPageChange,
  onView,
  onCopyReceipt,
  onViewMember,
}: PaymentsTableProps) {
  const handlers = { onView, onCopyReceipt, onViewMember };

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
        <p className="text-sm font-semibold text-ink">Couldn&apos;t load payments</p>
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
        <Button variant="primary" size="md" className="mt-4" onClick={onRecord}>
          Record payment
        </Button>
      </div>
    );
  }

  if (noResults) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium text-ink">No payments found</p>
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
        <table className="w-full min-w-[1000px] divide-y divide-line/60">
          <thead>
            <tr className="bg-card-hover/40">
              <SortHeader label="Receipt" sortKey="receipt" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <SortHeader label="Member" sortKey="member" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <SortHeader label="Amount" sortKey="amount" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <SortHeader label="Method" sortKey="method" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <SortHeader label="Date" sortKey="date" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                Reference
              </th>
              <SortHeader label="Status" sortKey="status" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40 bg-card/60">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-card-hover/60">
                <td className="px-4 py-3">
                  <span className="font-mono text-[12px] font-medium text-gold-soft">
                    {row.receiptNumber}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      initials={row.memberInitials}
                      index={row.memberCode.charCodeAt(row.memberCode.length - 1) % 4}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{row.memberName}</p>
                      <p className="truncate font-mono text-[11px] text-faint">{row.memberCode}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold tabular-nums text-ink">
                  {formatCurrency(paiseToAmount(row.amountPaise))}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={paymentModeTone(row.paymentMode)}>{row.modeLabel}</Badge>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs text-subtle">{formatShortDate(row.dateKey)}</p>
                  <p className="mt-0.5 text-[11px] text-faint">{formatTime(row.paymentDate)}</p>
                </td>
                <td className="px-4 py-3">
                  {row.reference ? (
                    <span className="font-mono text-[11px] text-subtle">{row.reference}</span>
                  ) : (
                    <span className="text-xs text-faint">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={paymentStatusTone(row.status)} dot>
                    {paymentStatusLabel(row.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(row)}
                      aria-label={`View receipt ${row.receiptNumber}`}
                    >
                      <Eye className="size-3.5" strokeWidth={1.75} aria-hidden />
                      View
                    </Button>
                    <ActionMenu
                      label={`Actions for ${row.receiptNumber}`}
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
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  initials={row.memberInitials}
                  index={row.memberCode.charCodeAt(row.memberCode.length - 1) % 4}
                  className="size-9"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{row.memberName}</p>
                  <p className="truncate font-mono text-[11px] text-faint">
                    {row.receiptNumber}
                  </p>
                </div>
              </div>
              <Badge tone={paymentStatusTone(row.status)} dot>
                {paymentStatusLabel(row.status)}
              </Badge>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="gold">{formatCurrency(paiseToAmount(row.amountPaise))}</Badge>
              <Badge tone={paymentModeTone(row.paymentMode)}>{row.modeLabel}</Badge>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line/50 pt-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-faint">Date</dt>
                <dd className="text-subtle">{formatShortDate(row.dateKey)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-faint">Time</dt>
                <dd className="text-subtle">{formatTime(row.paymentDate)}</dd>
              </div>
              <div className="col-span-2 flex items-center justify-between gap-2">
                <dt className="text-faint">Reference</dt>
                <dd className="truncate font-mono text-[11px] text-subtle">
                  {row.reference ?? "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/50 pt-3">
              <Button variant="secondary" size="sm" onClick={() => onView(row)}>
                <Eye className="size-3.5" strokeWidth={1.75} aria-hidden />
                View receipt
              </Button>
              <ActionMenu
                label={`Actions for ${row.receiptNumber}`}
                items={actionItems(row, handlers)}
              />
            </div>
          </li>
        ))}
      </ul>

      {totalCount > 0 && (
        <div className="mt-4 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-faint">
            Showing{" "}
            <span className="font-medium tabular-nums text-subtle">
              {rangeStart}–{rangeEnd}
            </span>{" "}
            of <span className="font-medium tabular-nums text-subtle">{totalCount}</span>
          </p>
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
  sortKey: PaymentsSortKey;
  active: PaymentsSortKey;
  dir: SortDir;
  onSort: (key: PaymentsSortKey) => void;
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
