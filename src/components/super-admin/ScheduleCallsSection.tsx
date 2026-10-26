"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  Inbox,
  Phone,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/providers/ToastProvider";
import { useScheduleCallTemplate } from "@/hooks/use-schedule-call-template";
import {
  SUPER_ADMIN_PATH,
  listScheduleCalls,
  type ScheduleCallDto,
} from "@/lib/api";
import {
  formatCallDistance,
  formatScheduleCallDate,
  formatScheduleCallDateTime,
  scheduleCallStatus,
} from "@/lib/schedule-call-view";
import { buildScheduleCallWhatsAppUrl } from "@/lib/schedule-call-whatsapp";
import { formatNumber } from "@/lib/format";
import { platformInitials } from "@/lib/super-admin-view";
import { ScheduleCallStatusBadge } from "./ScheduleCallStatusBadge";

const CALLS_PATH = `${SUPER_ADMIN_PATH}/schedule-calls`;

export function ScheduleCallsSection() {
  const toast = useToast();
  const template = useScheduleCallTemplate();
  const [calls, setCalls] = useState<ScheduleCallDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);

    listScheduleCalls(controller.signal)
      .then((result) => {
        if (active) setCalls(result);
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Couldn't load schedule call enquiries.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  const stats = useMemo(() => {
    const counts = { upcoming: 0, today: 0, past: 0 };
    calls.forEach((call) => {
      counts[scheduleCallStatus(call)] += 1;
    });
    return counts;
  }, [calls]);

  const latest = calls.slice(0, 5);

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

  return (
    <section className="mt-4 rounded-2xl border border-line bg-card/60">
      <div className="flex flex-col gap-3 border-b border-line/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
            <CalendarClock className="size-4.5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[14px] font-semibold text-ink">
                Schedule call enquiries
              </h2>
              {!loading && !error && (
                <Badge tone="gold">{formatNumber(calls.length)} total</Badge>
              )}
            </div>
            <p className="mt-0.5 text-[11.5px] text-faint">
              Visitors who asked the team for a walkthrough call.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className="inline-flex size-8 items-center justify-center rounded-lg border border-line bg-card text-faint transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
            aria-label="Refresh schedule call enquiries"
            title="Refresh"
          >
            <RefreshCw
              className={loading ? "size-3.5 animate-spin" : "size-3.5"}
              strokeWidth={2}
              aria-hidden
            />
          </button>
          <Link
            href={CALLS_PATH}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-gold hover:text-gold-bright"
          >
            View all
            <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-line/50 border-b border-line/50">
        {[
          { label: "Upcoming", value: stats.upcoming, tone: "text-gold" },
          { label: "Today", value: stats.today, tone: "text-warning" },
          { label: "Past", value: stats.past, tone: "text-subtle" },
        ].map((stat) => (
          <div key={stat.label} className="px-5 py-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-faint">
              {stat.label}
            </p>
            {loading ? (
              <div className="mt-1.5 h-5 w-10 animate-pulse rounded bg-card-hover" />
            ) : (
              <p className={`mt-1 text-[19px] font-bold tabular-nums ${stat.tone}`}>
                {formatNumber(stat.value)}
              </p>
            )}
          </div>
        ))}
      </div>

      {error ? (
        <div className="flex flex-col items-start gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <ShieldAlert
              className="mt-0.5 size-4 shrink-0 text-danger"
              strokeWidth={1.75}
              aria-hidden
            />
            <div>
              <p className="text-[12.5px] font-medium text-ink">
                Couldn&apos;t load enquiries
              </p>
              <p className="mt-0.5 text-[11.5px] text-subtle">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={reload}
            className="text-[12px] font-medium text-gold hover:text-gold-bright"
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="divide-y divide-line/40">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="px-5 py-3">
              <div className="h-9 animate-pulse rounded-md bg-card-hover/50" />
            </div>
          ))}
        </div>
      ) : latest.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gold/10 text-gold ring-1 ring-inset ring-gold/20">
            <Inbox className="size-4.5" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="mt-3 text-sm font-medium text-ink">
            No schedule call enquiries yet
          </p>
          <p className="mt-1 max-w-sm text-[12px] text-subtle">
            Requests submitted from the landing page will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[1000px] divide-y divide-line/40">
              <thead>
                <tr className="bg-card-hover/25">
                  {[
                    "Customer",
                    "Mobile",
                    "Scheduled call",
                    "Notes",
                    "IP address",
                    "Status",
                    "Created",
                  ].map(
                    (label) => (
                      <th
                        key={label}
                        className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-faint"
                      >
                        {label}
                      </th>
                    ),
                  )}
                  <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {latest.map((call) => {
                  const status = scheduleCallStatus(call);
                  return (
                    <tr
                      key={call.id}
                      className="transition-colors hover:bg-card-hover/40"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={CALLS_PATH}
                          className="flex items-center gap-2.5"
                        >
                          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/12 text-[10px] font-semibold text-gold ring-1 ring-inset ring-gold/20">
                            {platformInitials(call.clientName)}
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[180px] truncate text-[13px] font-medium text-ink">
                              {call.clientName}
                            </span>
                            <span className="block font-mono text-[10px] text-faint">
                              #{call.id}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <a
                          href={`tel:${call.Mob.replace(/\s+/g, "")}`}
                          className="inline-flex items-center gap-1.5 text-[12px] text-subtle hover:text-gold"
                        >
                          <Phone
                            className="size-3.5"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          {call.Mob}
                        </a>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <p className="text-[12px] text-ink">
                          {formatScheduleCallDateTime(call.callTime)}
                        </p>
                        <p className="text-[10.5px] text-faint">
                          {formatCallDistance(call.callTime)}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        {call.note?.trim() ? (
                          <p
                            className="max-w-[190px] truncate text-[11.5px] text-subtle"
                            title={call.note}
                          >
                            {call.note}
                          </p>
                        ) : (
                          <span className="text-[11.5px] text-faint">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className="font-mono text-[11px] text-subtle">
                          {call.ipAddress}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <ScheduleCallStatusBadge status={status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-[11.5px] text-faint">
                        {formatScheduleCallDate(call.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openWhatsApp(call)}
                            aria-label={`Message ${call.clientName} on WhatsApp`}
                            title="Message on WhatsApp"
                            className="inline-flex size-8 items-center justify-center rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366] transition-colors hover:bg-[#25D366]/18"
                          >
                            <FaWhatsapp className="size-4" aria-hidden />
                          </button>
                          <Link
                            href={CALLS_PATH}
                            className="inline-flex items-center gap-1 text-[11.5px] font-medium text-gold hover:text-gold-bright"
                          >
                            Open
                            <ChevronRight
                              className="size-3.5"
                              strokeWidth={2}
                              aria-hidden
                            />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-line/40 sm:hidden">
            {latest.map((call) => {
              const status = scheduleCallStatus(call);
              return (
                <li key={call.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {call.clientName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-faint">
                        {formatScheduleCallDateTime(call.callTime)}
                      </p>
                    </div>
                    <ScheduleCallStatusBadge status={status} />
                  </div>
                  <div className="mt-2 space-y-1 border-t border-line/40 pt-2 text-[11px]">
                    {call.note?.trim() && (
                      <p className="line-clamp-2 text-subtle">{call.note}</p>
                    )}
                    <p className="font-mono text-faint">{call.ipAddress}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <a
                      href={`tel:${call.Mob.replace(/\s+/g, "")}`}
                      className="text-[12px] text-gold"
                    >
                      {call.Mob}
                    </a>
                    <button
                      type="button"
                      onClick={() => openWhatsApp(call)}
                      className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 px-2.5 text-[11.5px] font-medium text-[#25D366]"
                    >
                      <FaWhatsapp className="size-3.5" aria-hidden />
                      WhatsApp
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="border-t border-line/60 px-5 py-3">
        <Link
          href={CALLS_PATH}
          className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-gold hover:text-gold-bright"
        >
          Manage all enquiries, search, edit and delete
          <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
