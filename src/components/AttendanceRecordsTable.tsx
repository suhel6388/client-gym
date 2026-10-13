"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  attendanceTone,
  formatDuration,
  formatTime,
  methodLabel,
  methodTone,
  type AttendanceRow,
} from "@/lib/attendance-view";
import { ActionMenu, type ActionMenuItem } from "./ActionMenu";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

export type AttendanceSortKey =
  | "member"
  | "phone"
  | "plan"
  | "checkIn"
  | "checkOut"
  | "duration"
  | "method"
  | "status";

export type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<string, number> = {
  "Checked In": 0,
  "Checked Out": 1,
  Absent: 2,
};

export function compareAttendanceRows(
  a: AttendanceRow,
  b: AttendanceRow,
  key: AttendanceSortKey,
): number {
  switch (key) {
    case "member":
      return a.memberName.localeCompare(b.memberName);
    case "phone":
      return a.memberPhone.localeCompare(b.memberPhone);
    case "plan":
      return a.planName.localeCompare(b.planName);
    case "checkOut":
      return (a.checkOutAt ?? "").localeCompare(b.checkOutAt ?? "");
    case "duration":
      return (a.durationMinutes ?? -1) - (b.durationMinutes ?? -1);
    case "method":
      return (a.method ?? "").localeCompare(b.method ?? "");
    case "status":
      return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    case "checkIn":
    default:
      return (a.checkInAt ?? "").localeCompare(b.checkInAt ?? "");
  }
}

type AttendanceRecordsTableProps = {
  rows: AttendanceRow[];
  totalCount: number;
  page: number;
  pageCount: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  empty: boolean;
  noResults: boolean;
  onClearFilters: () => void;
  onMarkAttendance: () => void;
  sortKey: AttendanceSortKey;
  sortDir: SortDir;
  onToggleSort: (key: AttendanceSortKey) => void;
  onPageChange: (page: number) => void;
  onCheckOut: (row: AttendanceRow) => void;
  onViewMember: (row: AttendanceRow) => void;
};

function actionItems(
  row: AttendanceRow,
  handlers: Pick<AttendanceRecordsTableProps, "onCheckOut" | "onViewMember">,
): ActionMenuItem[] {
  const items: ActionMenuItem[] = [];
  if (row.recordId && row.status === "Checked In") {
    items.push({
      label: "Record check-out",
      icon: LogOut,
      onSelect: () => handlers.onCheckOut(row),
    });
  }
  items.push({
    label: "View member profile",
    icon: UserRound,
    onSelect: () => handlers.onViewMember(row),
  });
  return items;
}

export function AttendanceRecordsTable({
  rows,
  totalCount,
  page,
  pageCount,
  pageSize,
  loading,
  error,
  onRetry,
  empty,
  noResults,
  onClearFilters,
  onMarkAttendance,
  sortKey,
  sortDir,
  onToggleSort,
  onPageChange,
  onCheckOut,
  onViewMember,
}: AttendanceRecordsTableProps) {
  const handlers = { onCheckOut, onViewMember };

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
        <p className="text-sm font-semibold text-ink">Couldn&apos;t load attendance</p>
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
          <UserRound className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="mt-4 text-sm font-semibold text-ink">No attendance recorded</p>
        <p className="mt-1 max-w-sm text-sm text-subtle">
          Nothing has been logged for this period yet. Mark a visit to get started.
        </p>
        <Button variant="primary" size="md" className="mt-4" onClick={onMarkAttendance}>
          Mark attendance
        </Button>
      </div>
    );
  }

  if (noResults) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium text-ink">No attendance found</p>
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
              <SortHeader label="Member" sortKey="member" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                Phone
              </th>
              <SortHeader label="Plan" sortKey="plan" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <SortHeader label="Check-in" sortKey="checkIn" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <SortHeader label="Check-out" sortKey="checkOut" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <SortHeader label="Duration" sortKey="duration" active={sortKey} dir={sortDir} onSort={onToggleSort} />
              <SortHeader label="Method" sortKey="method" active={sortKey} dir={sortDir} onSort={onToggleSort} />
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
                </td>
                <td className="px-4 py-3 text-xs tabular-nums text-subtle">
                  {formatTime(row.checkInAt)}
                </td>
                <td className="px-4 py-3 text-xs tabular-nums text-subtle">
                  {formatTime(row.checkOutAt)}
                </td>
                <td className="px-4 py-3 text-xs tabular-nums text-subtle">
                  {formatDuration(row.durationMinutes)}
                </td>
                <td className="px-4 py-3">
                  {row.method ? (
                    <Badge tone={methodTone(row.method)}>{methodLabel(row.method)}</Badge>
                  ) : (
                    <span className="text-xs text-faint">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={attendanceTone(row.status)} dot>
                    {row.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {row.recordId && row.status === "Checked In" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCheckOut(row)}
                        aria-label={`Check out ${row.memberName}`}
                      >
                        <LogOut className="size-3.5" strokeWidth={1.75} aria-hidden />
                        Check out
                      </Button>
                    )}
                    <ActionMenu
                      label={`Actions for ${row.memberName}`}
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
                    {row.memberCode} · {row.memberPhone}
                  </p>
                </div>
              </div>
              <Badge tone={attendanceTone(row.status)} dot>
                {row.status}
              </Badge>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="gold">{row.planName}</Badge>
              {row.method && <Badge tone={methodTone(row.method)}>{methodLabel(row.method)}</Badge>}
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line/50 pt-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-faint">Check-in</dt>
                <dd className="tabular-nums text-subtle">{formatTime(row.checkInAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-faint">Check-out</dt>
                <dd className="tabular-nums text-subtle">{formatTime(row.checkOutAt)}</dd>
              </div>
              <div className="col-span-2 flex items-center justify-between gap-2">
                <dt className="text-faint">Duration</dt>
                <dd className="tabular-nums text-subtle">
                  {formatDuration(row.durationMinutes)}
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/50 pt-3">
              {row.recordId && row.status === "Checked In" ? (
                <Button variant="secondary" size="sm" onClick={() => onCheckOut(row)}>
                  <LogOut className="size-3.5" strokeWidth={1.75} aria-hidden />
                  Check out
                </Button>
              ) : (
                <span className="text-[11px] text-faint">{row.date}</span>
              )}
              <ActionMenu
                label={`Actions for ${row.memberName}`}
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
  sortKey: AttendanceSortKey;
  active: AttendanceSortKey;
  dir: SortDir;
  onSort: (key: AttendanceSortKey) => void;
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
