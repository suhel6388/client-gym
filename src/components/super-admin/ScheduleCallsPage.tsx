"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe2,
  Inbox,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/providers/ToastProvider";
import { useScheduleCallTemplate } from "@/hooks/use-schedule-call-template";
import { useScheduleCalls } from "@/hooks/use-schedule-calls";
import {
  SUPER_ADMIN_PATH,
  deleteScheduleCall,
  type ScheduleCallDto,
  type ScheduleCallStatusFilter,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  formatCallDistance,
  formatScheduleCallDate,
  formatScheduleCallDateTime,
  scheduleCallStatus,
} from "@/lib/schedule-call-view";
import { buildScheduleCallWhatsAppUrl } from "@/lib/schedule-call-whatsapp";
import { formatNumber } from "@/lib/format";
import { platformInitials } from "@/lib/super-admin-view";
import { ScheduleCallEditDialog } from "./ScheduleCallEditDialog";
import { ScheduleCallStatusBadge } from "./ScheduleCallStatusBadge";
import { ScheduleCallViewDialog } from "./ScheduleCallViewDialog";

const SETTINGS_PATH = `${SUPER_ADMIN_PATH}/settings`;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const STATUS_OPTIONS: Array<{
  value: ScheduleCallStatusFilter;
  label: string;
}> = [
  { value: "", label: "All enquiries" },
  { value: "upcoming", label: "Upcoming" },
  { value: "today", label: "Today" },
  { value: "past", label: "Past" },
];

type IconActionProps = {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger" | "whatsapp";
  children: React.ReactNode;
};

function IconAction({ label, onClick, tone = "default", children }: IconActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg border transition-colors",
        tone === "default" &&
          "border-line bg-card text-faint hover:border-line-strong hover:bg-card-hover hover:text-ink",
        tone === "danger" &&
          "border-danger/25 bg-danger/8 text-danger hover:border-danger/45 hover:bg-danger/15",
        tone === "whatsapp" &&
          "border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366] hover:border-[#25D366]/50 hover:bg-[#25D366]/18",
      )}
    >
      {children}
    </button>
  );
}

export function ScheduleCallsPage() {
  const toast = useToast();
  const template = useScheduleCallTemplate();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<ScheduleCallStatusFilter>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const [viewCall, setViewCall] = useState<ScheduleCallDto | null>(null);
  const [editCall, setEditCall] = useState<ScheduleCallDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleCallDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    calls,
    total,
    page: currentPage,
    totalPages,
    loading,
    error,
    reload,
  } = useScheduleCalls({
    q: debouncedSearch,
    status,
    page,
    limit: pageSize,
  });

  // Deleting the last row on a page (or a filter shrinking the result set) can
  // leave the requested page beyond the last one.
  useEffect(() => {
    if (!loading && page > totalPages) setPage(totalPages);
  }, [loading, page, totalPages]);

  const hasFilters = Boolean(debouncedSearch || status);

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("");
    setPage(1);
  };

  const openWhatsApp = (call: ScheduleCallDto) => {
    const url = buildScheduleCallWhatsAppUrl(call, template);
    if (!url) {
      toast.error(
        "WhatsApp unavailable",
        `${call.clientName}'s mobile number can't be opened in WhatsApp.`,
      );
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const requestDelete = (call: ScheduleCallDto) => {
    setViewCall(null);
    setDeleteTarget(call);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteScheduleCall(deleteTarget.id);
      toast.success(
        "Enquiry deleted",
        `${deleteTarget.clientName}'s scheduled call was removed.`,
      );
      setDeleteTarget(null);
      if (calls.length === 1 && page > 1) {
        setPage((value) => Math.max(1, value - 1));
      } else {
        reload();
      }
    } catch (err) {
      toast.error(
        "Couldn't delete the enquiry",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const rangeStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(rangeStart + calls.length - 1, total);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <CalendarClock className="size-4.5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
                Schedule call enquiries
              </h1>
              <p className="mt-1 text-sm text-subtle">
                Every walkthrough request captured from the landing page.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-faint">
            Live database records · newest first
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={SETTINGS_PATH}
            className="inline-flex h-9.5 items-center gap-2 rounded-lg border border-line bg-card px-4 text-sm text-ink transition-colors hover:border-line-strong hover:bg-card-hover"
          >
            <Settings2 className="size-4" strokeWidth={1.75} aria-hidden />
            Message template
          </Link>
          <Button variant="secondary" size="md" onClick={reload} disabled={loading}>
            <RefreshCw
              className={cn("size-4", loading && "animate-spin")}
              strokeWidth={2}
              aria-hidden
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-card/60 p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_190px_150px]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint"
              strokeWidth={1.75}
              aria-hidden
            />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, mobile, IP, note or enquiry ID…"
              aria-label="Search schedule call enquiries"
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ScheduleCallStatusFilter);
              setPage(1);
            }}
            aria-label="Filter by call status"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            value={String(pageSize)}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-[11px] text-faint">
            <span className="font-medium tabular-nums text-subtle">
              {formatNumber(total)}
            </span>{" "}
            {total === 1 ? "enquiry" : "enquiries"}
            {hasFilters ? " matched" : " total"}
          </p>
          {hasFilters && (
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                className="size-3.5 text-faint"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="text-[11px] text-faint">Filters active</span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] font-medium text-gold hover:text-gold-bright"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <ShieldAlert
              className="mt-0.5 size-4 shrink-0 text-danger"
              strokeWidth={1.75}
              aria-hidden
            />
            <div>
              <p className="text-[12.5px] font-semibold text-ink">
                Couldn&apos;t load schedule call enquiries
              </p>
              <p className="mt-0.5 text-[12px] text-subtle">{error}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={reload}>
            Try again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="mt-4 space-y-2.5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl border border-line/60 bg-card-hover/30"
            />
          ))}
        </div>
      ) : error ? null : calls.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-line bg-card/40 px-6 py-14 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold/10 text-gold ring-1 ring-inset ring-gold/20">
            <Inbox className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="mt-4 text-sm font-semibold text-ink">
            {hasFilters
              ? "No enquiries match these filters"
              : "No schedule call enquiries yet"}
          </p>
          <p className="mt-1 max-w-sm text-sm text-subtle">
            {hasFilters
              ? "Try a different search term or clear the status filter."
              : "Enquiries appear here as soon as visitors request a call from the landing page."}
          </p>
          {hasFilters && (
            <Button
              variant="secondary"
              size="md"
              className="mt-4"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-line/80 lg:block">
            <table className="w-full min-w-[1140px] divide-y divide-line/60">
              <thead>
                <tr className="bg-card-hover/40">
                  {[
                    "Customer",
                    "Mobile",
                    "Scheduled call",
                    "Notes",
                    "IP address",
                    "Created",
                    "Status",
                  ].map((label) => (
                    <th
                      key={label}
                      className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-faint"
                    >
                      {label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-[10.5px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 bg-card/50">
                {calls.map((call) => {
                  const status = scheduleCallStatus(call);
                  return (
                    <tr
                      key={call.id}
                      className="transition-colors hover:bg-card-hover/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            initials={platformInitials(call.clientName)}
                            index={call.id % 4}
                            className="size-9"
                          />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setViewCall(call)}
                              className="block max-w-[190px] truncate text-left text-[13px] font-medium text-ink hover:text-gold"
                            >
                              {call.clientName}
                            </button>
                            <p className="truncate font-mono text-[10.5px] text-faint">
                              #{call.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <a
                          href={`tel:${call.Mob.replace(/\s+/g, "")}`}
                          className="inline-flex items-center gap-1.5 text-[12.5px] text-subtle hover:text-gold"
                        >
                          <Phone
                            className="size-3.5 shrink-0"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          {call.Mob}
                        </a>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="text-[12.5px] text-ink">
                          {formatScheduleCallDateTime(call.callTime)}
                        </p>
                        <p className="text-[10.5px] text-faint">
                          {formatCallDistance(call.callTime)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {call.note?.trim() ? (
                          <p
                            className="max-w-[220px] truncate text-[12px] text-subtle"
                            title={call.note}
                          >
                            {call.note}
                          </p>
                        ) : (
                          <span className="text-[12px] text-faint">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-subtle">
                          <Globe2
                            className="size-3.5 shrink-0 text-faint"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          {call.ipAddress}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="text-[12px] text-subtle">
                          {formatScheduleCallDate(call.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <ScheduleCallStatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <IconAction
                            label={`Message ${call.clientName} on WhatsApp`}
                            tone="whatsapp"
                            onClick={() => openWhatsApp(call)}
                          >
                            <FaWhatsapp className="size-4" aria-hidden />
                          </IconAction>
                          <IconAction
                            label={`View enquiry #${call.id}`}
                            onClick={() => setViewCall(call)}
                          >
                            <Eye className="size-4" strokeWidth={1.75} aria-hidden />
                          </IconAction>
                          <IconAction
                            label={`Edit enquiry #${call.id}`}
                            onClick={() => setEditCall(call)}
                          >
                            <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                          </IconAction>
                          <IconAction
                            label={`Delete enquiry #${call.id}`}
                            tone="danger"
                            onClick={() => requestDelete(call)}
                          >
                            <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                          </IconAction>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="mt-4 space-y-3 lg:hidden">
            {calls.map((call) => {
              const status = scheduleCallStatus(call);
              return (
                <li
                  key={call.id}
                  className="rounded-xl border border-line bg-card/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        initials={platformInitials(call.clientName)}
                        index={call.id % 4}
                        className="size-9"
                      />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setViewCall(call)}
                          className="block max-w-[200px] truncate text-left text-[13.5px] font-medium text-ink"
                        >
                          {call.clientName}
                        </button>
                        <p className="truncate font-mono text-[10.5px] text-faint">
                          #{call.id}
                        </p>
                      </div>
                    </div>
                    <ScheduleCallStatusBadge status={status} />
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line/50 pt-3 text-[11.5px]">
                    <div>
                      <dt className="text-faint">Mobile</dt>
                      <dd className="mt-0.5">
                        <a
                          href={`tel:${call.Mob.replace(/\s+/g, "")}`}
                          className="text-gold"
                        >
                          {call.Mob}
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-faint">Scheduled</dt>
                      <dd className="mt-0.5 text-subtle">
                        {formatScheduleCallDateTime(call.callTime)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-faint">IP address</dt>
                      <dd className="mt-0.5 font-mono text-[11px] text-subtle">
                        {call.ipAddress}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-faint">Created</dt>
                      <dd className="mt-0.5 text-subtle">
                        {formatScheduleCallDate(call.createdAt)}
                      </dd>
                    </div>
                    {call.note?.trim() && (
                      <div className="col-span-2">
                        <dt className="text-faint">Notes</dt>
                        <dd className="mt-0.5 whitespace-pre-wrap text-subtle">
                          {call.note}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/50 pt-3">
                    <button
                      type="button"
                      onClick={() => openWhatsApp(call)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 px-3 text-[12px] font-medium text-[#25D366]"
                    >
                      <FaWhatsapp className="size-3.5" aria-hidden />
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewCall(call)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-[12px] font-medium text-subtle"
                    >
                      <Eye className="size-3.5" strokeWidth={1.75} aria-hidden />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditCall(call)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-[12px] font-medium text-subtle"
                    >
                      <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDelete(call)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-danger/25 bg-danger/8 px-3 text-[12px] font-medium text-danger"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-faint">
              Showing{" "}
              <span className="font-medium tabular-nums text-subtle">
                {rangeStart}–{rangeEnd}
              </span>{" "}
              of{" "}
              <span className="font-medium tabular-nums text-subtle">
                {formatNumber(total)}
              </span>{" "}
              enquiries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1 || loading}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-3.5" strokeWidth={2} aria-hidden />
                Prev
              </Button>
              <span className="text-xs tabular-nums text-subtle">
                Page {currentPage} of {Math.max(1, totalPages)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages || loading}
                onClick={() => setPage((value) => value + 1)}
                aria-label="Next page"
              >
                Next
                <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden />
              </Button>
            </div>
          </div>
        </>
      )}

      {viewCall && (
        <ScheduleCallViewDialog
          call={viewCall}
          onClose={() => setViewCall(null)}
          onEdit={(call) => {
            setViewCall(null);
            setEditCall(call);
          }}
          onDelete={requestDelete}
          onWhatsApp={openWhatsApp}
        />
      )}

      {editCall && (
        <ScheduleCallEditDialog
          key={editCall.id}
          call={editCall}
          onClose={() => setEditCall(null)}
          onUpdated={() => reload()}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete enquiry #${deleteTarget?.id ?? ""}?`}
        description={
          deleteTarget
            ? `${deleteTarget.clientName} (${deleteTarget.Mob}) will be removed permanently. This action can't be undone.`
            : undefined
        }
        confirmLabel="Delete enquiry"
        cancelLabel="Keep enquiry"
        loading={deleting}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDelete()}
      />

      <div className="mt-5 flex items-center gap-2 text-[11px] text-faint">
        <span>
          Status is derived from the scheduled time. Mobile and IP address are
          captured automatically and cannot be edited.
        </span>
      </div>
    </div>
  );
}
