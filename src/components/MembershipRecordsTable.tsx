"use client";

import {
  Ban,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Eye,
  RefreshCw,
  Repeat,
  Snowflake,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { paiseToAmount } from "@/lib/members-api";
import {
  paymentStatusFor,
  paymentTone,
  subscriptionTone,
  type SubscriptionRow,
  type SubscriptionStatus,
} from "@/lib/membership-view";
import { ActionMenu, type ActionMenuItem } from "./ActionMenu";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

export type RecordsSortKey =
  | "member"
  | "phone"
  | "plan"
  | "status"
  | "start"
  | "expires"
  | "fee"
  | "paid"
  | "balance";

export type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<SubscriptionStatus, number> = {
  Active: 0,
  Expiring: 1,
  Frozen: 2,
  Expired: 3,
  Cancelled: 4,
  Inactive: 5,
};

export function compareRows(a: SubscriptionRow, b: SubscriptionRow, key: RecordsSortKey): number {
  switch (key) {
    case "member":
      return a.memberName.localeCompare(b.memberName);
    case "phone":
      return a.memberPhone.localeCompare(b.memberPhone);
    case "plan":
      return a.planName.localeCompare(b.planName);
    case "status":
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    case "start":
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    case "fee":
      return a.feePaise - b.feePaise;
    case "paid":
      return a.paidPaise - b.paidPaise;
    case "balance":
      return a.balancePaise - b.balancePaise;
    case "expires":
    default:
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
  }
}

function durationLabel(months: number): string {
  if (months <= 0) return "—";
  if (months % 12 === 0) return `${months} mo`;
  return `${months} mo`;
}

function expiryLabel(row: SubscriptionRow): string | null {
  if (row.status === "Expiring") {
    return row.daysLeft <= 0 ? "Due today" : `${row.daysLeft}d left`;
  }
  if (row.status === "Expired") {
    return `${Math.abs(row.daysLeft)}d ago`;
  }
  return null;
}

type MembershipRecordsTableProps = {
  rows: SubscriptionRow[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  empty: boolean;
  noResults: boolean;
  onClearFilters: () => void;
  onAssign: () => void;

  sortKey: RecordsSortKey;
  sortDir: SortDir;
  onToggleSort: (key: RecordsSortKey) => void;

  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;

  onView: (row: SubscriptionRow) => void;
  onRenew: (row: SubscriptionRow) => void;
  onFreeze: (row: SubscriptionRow) => void;
  onCancel: (row: SubscriptionRow) => void;
  onRecordPayment: (row: SubscriptionRow) => void;
};

function actionItems(
  row: SubscriptionRow,
  handlers: Pick<
    MembershipRecordsTableProps,
    "onView" | "onRenew" | "onFreeze" | "onCancel" | "onRecordPayment"
  >,
): ActionMenuItem[] {
  const items: ActionMenuItem[] = [
    { label: "View details", icon: Eye, onSelect: () => handlers.onView(row) },
    { label: "Record payment", icon: Wallet, onSelect: () => handlers.onRecordPayment(row) },
    { label: "Renew membership", icon: Repeat, onSelect: () => handlers.onRenew(row) },
  ];
  if (row.status === "Active" || row.status === "Expiring") {
    items.push({ label: "Freeze membership", icon: Snowflake, onSelect: () => handlers.onFreeze(row) });
  }
  if (row.status !== "Cancelled") {
    items.push({
      label: "Cancel membership",
      icon: Ban,
      danger: true,
      onSelect: () => handlers.onCancel(row),
    });
  }
  return items;
}

export function MembershipRecordsTable({
  rows,
  totalCount,
  loading,
  error,
  onRetry,
  empty,
  noResults,
  onClearFilters,
  onAssign,
  sortKey,
  sortDir,
  onToggleSort,
  page,
  pageCount,
  onPageChange,
  onView,
  onRenew,
  onFreeze,
  onCancel,
  onRecordPayment,
}: MembershipRecordsTableProps) {
  const handlers = { onView, onRenew, onFreeze, onCancel, onRecordPayment };

  if (loading) {
    return (
      <div className="mt-5 space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-14 animate-pulse rounded-xl border border-line/70 bg-card-hover/40" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-semibold text-ink">Couldn&apos;t load memberships</p>
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
          <Repeat className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="mt-4 text-sm font-semibold text-ink">No subscriptions yet</p>
        <p className="mt-1 max-w-sm text-sm text-subtle">
          Assign a plan to a member to create the first subscription.
        </p>
        <Button variant="primary" size="md" className="mt-4" onClick={onAssign}>
          Assign membership
        </Button>
      </div>
    );
  }

  if (noResults) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium text-ink">No subscriptions found</p>
        <p className="mt-1 text-sm text-subtle">Try adjusting your search or filters.</p>
        <Button variant="secondary" size="md" className="mt-4" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    );
  }

  const rangeStart = (page - 1) * 10 + 1;
  const rangeEnd = Math.min(rangeStart + rows.length - 1, totalCount);

  return (
    <>
      {/* Desktop table */}
      <div className="mt-5 hidden overflow-x-auto rounded-xl border border-line/80 lg:block">
        <table className="w-full min-w-[1180px] divide-y divide-line/60">
          <thead>
            <tr className="bg-card-hover/40">
              <SortHeader label="Member" sortKey="member" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                Phone
              </th>
              <SortHeader label="Plan" sortKey="plan" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <SortHeader label="Start" sortKey="start" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <SortHeader label="Expiry" sortKey="expires" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <SortHeader label="Total fee" sortKey="fee" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <SortHeader label="Paid" sortKey="paid" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <SortHeader label="Balance" sortKey="balance" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                Payment
              </th>
              <SortHeader label="Status" sortKey="status" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40 bg-card/60">
            {rows.map((row) => {
              const payment = paymentStatusFor(row);
              const expiry = expiryLabel(row);
              return (
                <tr key={row.id} className="transition-colors hover:bg-card-hover/60">
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
                  <td className="px-4 py-3 font-mono text-[11px] text-subtle">{row.memberPhone}</td>
                  <td className="px-4 py-3">
                    <Badge tone="gold">{row.planName}</Badge>
                    <p className="mt-1 text-[11px] text-faint">{durationLabel(row.durationMonths)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-subtle">
                    {formatShortDate(row.startDate.slice(0, 10))}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-subtle">{formatShortDate(row.endDate.slice(0, 10))}</p>
                    {expiry && (
                      <p
                        className={cn(
                          "mt-0.5 text-[11px] font-medium",
                          row.status === "Expired" ? "text-danger" : "text-warning",
                        )}
                      >
                        {expiry}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold tabular-nums text-ink">
                    {formatCurrency(paiseToAmount(row.feePaise))}
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums text-success">
                    {formatCurrency(paiseToAmount(row.paidPaise))}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-xs font-semibold tabular-nums",
                      row.balancePaise > 0 ? "text-warning" : "text-faint",
                    )}
                  >
                    {row.balancePaise > 0 ? formatCurrency(paiseToAmount(row.balancePaise)) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={paymentTone(payment)}>{payment}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={subscriptionTone(row.status)} dot>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(row)}
                        aria-label={`View ${row.memberName}`}
                      >
                        <Eye className="size-3.5" strokeWidth={1.75} aria-hidden />
                        View
                      </Button>
                      <ActionMenu
                        label={`Actions for ${row.memberName}`}
                        items={actionItems(row, handlers)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="mt-5 space-y-3 lg:hidden">
        {rows.map((row) => {
          const payment = paymentStatusFor(row);
          const expiry = expiryLabel(row);
          return (
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
                      {row.memberCode} · {row.memberPhone}
                    </p>
                  </div>
                </div>
                <Badge tone={subscriptionTone(row.status)} dot>
                  {row.status}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone="gold">{row.planName}</Badge>
                <Badge tone={paymentTone(payment)}>{payment}</Badge>
                {expiry && (
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      row.status === "Expired" ? "text-danger" : "text-warning",
                    )}
                  >
                    {expiry}
                  </span>
                )}
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line/50 pt-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-faint">Start</dt>
                  <dd className="text-subtle">{formatShortDate(row.startDate.slice(0, 10))}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-faint">Expiry</dt>
                  <dd className="text-subtle">{formatShortDate(row.endDate.slice(0, 10))}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-faint">Fee</dt>
                  <dd className="font-semibold tabular-nums text-ink">
                    {formatCurrency(paiseToAmount(row.feePaise))}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-faint">Paid</dt>
                  <dd className="tabular-nums text-success">
                    {formatCurrency(paiseToAmount(row.paidPaise))}
                  </dd>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-2">
                  <dt className="text-faint">Outstanding</dt>
                  <dd
                    className={cn(
                      "font-semibold tabular-nums",
                      row.balancePaise > 0 ? "text-warning" : "text-faint",
                    )}
                  >
                    {formatCurrency(paiseToAmount(row.balancePaise))}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/50 pt-3">
                <Button variant="secondary" size="sm" onClick={() => onRenew(row)}>
                  <Repeat className="size-3.5" strokeWidth={1.75} aria-hidden />
                  Renew
                </Button>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onView(row)}>
                    <Eye className="size-3.5" strokeWidth={1.75} aria-hidden />
                    View
                  </Button>
                  <ActionMenu
                    label={`Actions for ${row.memberName}`}
                    items={actionItems(row, handlers)}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {totalCount > 0 && (
        <div className="mt-4 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-faint">
            Showing{" "}
            <span className="font-medium tabular-nums text-subtle">{rangeStart}–{rangeEnd}</span> of{" "}
            <span className="font-medium tabular-nums text-subtle">{totalCount}</span>
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
  sortKey: RecordsSortKey;
  active: RecordsSortKey;
  dir: SortDir;
  onSort: (key: RecordsSortKey) => void;
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
