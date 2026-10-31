"use client";

import {
  CalendarDays,
  Download,
  Fingerprint,
  Plus,
  RefreshCw,
  ScrollText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useToast } from "./providers/ToastProvider";
import {
  ATTENDANCE_DATA_SOURCE,
  getDeviceStatus,
  listAttendance,
  listEnrollments,
  type AttendanceDeviceDto,
  type AttendanceEnrollmentDto,
  type AttendanceRecordDto,
} from "@/lib/attendance-api";
import {
  addDaysKey,
  buildAttendanceRows,
  formatDayLabel,
  formatRangeLabel,
  periodRange,
  todayKey,
  type AttendancePeriod,
} from "@/lib/attendance-view";
import { ATTENDANCE_PERIODS } from "@/lib/attendance-view";
import type { PlanDto } from "@/lib/members-api";
import { listMembers, listMemberships, type MemberDto, type MembershipWithRelationsDto } from "@/lib/members-api";
import {
  AttendanceFilters,
  type AttendanceMethodFilter,
  type AttendanceStatusFilter,
} from "./AttendanceFilters";
import {
  AttendanceRecordsTable,
  compareAttendanceRows,
  type AttendanceSortKey,
  type SortDir,
} from "./AttendanceRecordsTable";
import { AttendanceStatsCards, type AttendanceStats } from "./AttendanceStatsCards";
import { BiometricAttendancePanel } from "./BiometricAttendancePanel";
import { ManualAttendanceDrawer } from "./ManualAttendanceDrawer";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";

type Tab = "records" | "biometric";

const PAGE_SIZE = 10;

export function AttendancePage() {
  const toast = useToast();
  const router = useRouter();

  const [members, setMembers] = useState<MemberDto[]>([]);
  const [memberships, setMemberships] = useState<MembershipWithRelationsDto[]>([]);
  const [records, setRecords] = useState<AttendanceRecordDto[]>([]);
  const [device, setDevice] = useState<AttendanceDeviceDto | null>(null);
  const [enrollments, setEnrollments] = useState<AttendanceEnrollmentDto[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [tab, setTab] = useState<Tab>("records");
  const [period, setPeriod] = useState<AttendancePeriod>("today");
  const [anchorDate, setAnchorDate] = useState(todayKey());
  const [customFrom, setCustomFrom] = useState(addDaysKey(todayKey(), -6));
  const [customTo, setCustomTo] = useState(todayKey());

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatusFilter>("All");
  const [methodFilter, setMethodFilter] = useState<AttendanceMethodFilter>("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [sortKey, setSortKey] = useState<AttendanceSortKey>("checkIn");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const [drawer, setDrawer] = useState<{
    open: boolean;
    presetMemberId: string | null;
    defaultDate: string;
  }>({ open: false, presetMemberId: null, defaultDate: todayKey() });

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "initial") {
        setStatus("loading");
        setError(null);
      } else {
        setRefreshing(true);
      }
      try {
        const [memberData, membershipData] = await Promise.all([
          listMembers(),
          listMemberships(),
        ]);
        const memberIds = memberData.map((member) => member.id);
        const [recordData, deviceData, enrollmentData] = await Promise.all([
          listAttendance(memberIds, {
            from: addDaysKey(todayKey(), -365),
            to: todayKey(),
          }),
          getDeviceStatus(memberIds),
          listEnrollments(memberIds),
        ]);
        setMembers(memberData);
        setMemberships(membershipData);
        setRecords(recordData);
        setDevice(deviceData);
        setEnrollments(enrollmentData);
        setStatus("ready");
      } catch (caught) {
        const message =
          caught instanceof ApiError
            ? caught.message
            : "Couldn't load attendance. Please try again.";
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

  const range = useMemo(() => {
    if (period === "custom") {
      const from = customFrom <= customTo ? customFrom : customTo;
      const to = customFrom <= customTo ? customTo : customFrom;
      return { from, to };
    }
    return periodRange(period, anchorDate);
  }, [period, anchorDate, customFrom, customTo]);

  const periodLabel =
    ATTENDANCE_PERIODS.find((option) => option.value === period)?.label ?? "Today";

  const rangedRecords = useMemo(
    () => records.filter((record) => record.date >= range.from && record.date <= range.to),
    [records, range],
  );

  const allRows = useMemo(
    () =>
      buildAttendanceRows({
        records: rangedRecords,
        members,
        memberships,
        absentDateKey: range.from === range.to ? range.from : null,
      }),
    [rangedRecords, members, memberships, range],
  );

  const planOptions = useMemo<PlanDto[]>(() => {
    const map = new Map<string, PlanDto>();
    for (const membership of memberships) {
      if (membership.plan) map.set(membership.plan.id, membership.plan);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [memberships]);

  const stats = useMemo<AttendanceStats>(() => {
    const focus = anchorDate;
    const presentIds = new Set(
      records.filter((record) => record.date === focus).map((record) => record.memberId),
    );
    const expected = members.filter((member) =>
      memberships.some(
        (membership) =>
          membership.memberId === member.id &&
          membership.startDate.slice(0, 10) <= focus &&
          membership.endDate.slice(0, 10) >= focus &&
          membership.status !== "CANCELLED" &&
          membership.status !== "FROZEN" &&
          membership.status !== "INACTIVE",
      ),
    );
    const presentExpected = expected.filter((member) => presentIds.has(member.id));
    const expectedCount = expected.length;
    const currentlyInside = new Set(
      records
        .filter((record) => record.date === todayKey() && !record.checkOutAt)
        .map((record) => record.memberId),
    ).size;

    return {
      present: presentExpected.length,
      absent: Math.max(0, expectedCount - presentExpected.length),
      expected: expectedCount,
      rate: expectedCount > 0 ? (presentExpected.length / expectedCount) * 100 : 0,
      currentlyInside,
    };
  }, [records, members, memberships, anchorDate]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return allRows.filter((row) => {
      const haystack = `${row.memberName} ${row.memberCode} ${row.memberPhone}`.toLowerCase();
      const matchesQuery = !term || haystack.includes(term);
      const matchesStatus =
        statusFilter === "All"
          ? true
          : statusFilter === "Present"
            ? row.status !== "Absent"
            : row.status === statusFilter;
      const matchesMethod =
        methodFilter === "All" ? true : row.method === methodFilter;
      const matchesPlan = planFilter === "All" ? true : row.planId === planFilter;
      return matchesQuery && matchesStatus && matchesMethod && matchesPlan;
    });
  }, [allRows, query, statusFilter, methodFilter, planFilter]);

  const sorted = useMemo(() => {
    const direction = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => compareAttendanceRows(a, b, sortKey) * direction);
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, methodFilter, planFilter, sortKey, sortDir, range.from, range.to]);

  const filtersActive =
    query.trim() !== "" ||
    statusFilter !== "All" ||
    methodFilter !== "All" ||
    planFilter !== "All";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("All");
    setMethodFilter("All");
    setPlanFilter("All");
  };

  const toggleSort = (key: AttendanceSortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const openDrawer = (presetMemberId: string | null = null, defaultDate = todayKey()) =>
    setDrawer({ open: true, presetMemberId, defaultDate });

  const exportCsv = () => {
    const header = [
      "Member ID",
      "Member",
      "Phone",
      "Plan",
      "Date",
      "Check-in",
      "Check-out",
      "Duration (min)",
      "Method",
      "Status",
    ];
    const lines = sorted.map((row) => [
      row.memberCode,
      row.memberName,
      row.memberPhone,
      row.planName,
      row.date,
      row.checkInAt ? new Date(row.checkInAt).toLocaleTimeString("en-US") : "",
      row.checkOutAt ? new Date(row.checkOutAt).toLocaleTimeString("en-US") : "",
      row.durationMinutes ?? "",
      row.method ?? "",
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
    anchor.download = `attendance-${range.from}_${range.to}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Export ready", `${sorted.length} attendance row(s) exported.`);
  };

  const showEmpty = status === "ready" && allRows.length === 0;
  const showNoResults = status === "ready" && allRows.length > 0 && filtered.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="animate-fade-up">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
              Attendance Management
            </h1>
            {ATTENDANCE_DATA_SOURCE === "demo" && (
              <span className="rounded-full bg-gold/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold ring-1 ring-inset ring-gold/25">
                Demo data
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-subtle">
            Track gym visits, manage check-ins, and monitor member attendance.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" strokeWidth={1.75} aria-hidden />
              {formatDayLabel(anchorDate)}
            </span>
            <span aria-hidden>·</span>
            <span>
              {periodLabel}: {formatRangeLabel(range.from, range.to)}
            </span>
          </div>
        </div>

        <div className="animate-fade-up flex flex-wrap gap-2.5" style={{ animationDelay: "80ms" }}>
          <Button
            variant="secondary"
            size="md"
            onClick={exportCsv}
            disabled={sorted.length === 0}
          >
            <Download className="size-4" strokeWidth={1.75} aria-hidden />
            Export Report
          </Button>
          <Button variant="primary" size="md" onClick={() => openDrawer()}>
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div
        className="animate-fade-up mt-6 grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap"
        style={{ animationDelay: "120ms" }}
      >
        <div className="col-span-2 w-full sm:col-span-1 sm:w-40">
          <Label htmlFor="att-period">Attendance period</Label>
          <Select
            id="att-period"
            className="mt-1.5"
            value={period}
            onChange={(event) => {
              const next = event.target.value as AttendancePeriod;
              setPeriod(next);
              if (next === "today" || next === "week" || next === "month") {
                setAnchorDate(todayKey());
              }
            }}
          >
            {ATTENDANCE_PERIODS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        {period === "custom" ? (
          <>
            <div className="col-span-1 w-full sm:w-40">
              <Label htmlFor="att-from">From</Label>
              <Input
                id="att-from"
                type="date"
                className="mt-1.5"
                value={customFrom}
                max={customTo}
                onChange={(event) => setCustomFrom(event.target.value)}
              />
            </div>
            <div className="col-span-1 w-full sm:w-40">
              <Label htmlFor="att-to">To</Label>
              <Input
                id="att-to"
                type="date"
                className="mt-1.5"
                value={customTo}
                min={customFrom}
                max={todayKey()}
                onChange={(event) => setCustomTo(event.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="col-span-2 w-full sm:col-span-1 sm:w-40">
            <Label htmlFor="att-date">Date</Label>
            <Input
              id="att-date"
              type="date"
              className="mt-1.5"
              value={anchorDate}
              max={todayKey()}
              onChange={(event) => setAnchorDate(event.target.value)}
            />
          </div>
        )}

        <Button
          variant="ghost"
          size="md"
          onClick={() => load("refresh")}
          disabled={refreshing || status === "loading"}
          className="col-span-2 w-full sm:col-span-1 sm:ml-auto sm:w-auto"
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
      <AttendanceStatsCards
        stats={stats}
        loading={status === "loading"}
        dateLabel={formatDayLabel(anchorDate)}
        periodLabel={periodLabel}
      />

      {/* Tabs */}
      <div className="mt-6 flex items-center gap-1.5 rounded-xl border border-line bg-card p-1 sm:w-fit">
        {(
          [
            { value: "records", label: "Attendance Records", icon: ScrollText },
            { value: "biometric", label: "Biometric Attendance", icon: Fingerprint },
          ] as { value: Tab; label: string; icon: typeof ScrollText }[]
        ).map((item) => {
          const active = tab === item.value;
          const Icon = item.icon;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              aria-pressed={active}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors sm:flex-none",
                active
                  ? "bg-gold/12 text-gold ring-1 ring-inset ring-gold/25"
                  : "text-subtle hover:bg-card-hover hover:text-ink",
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} aria-hidden />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "records" ? (
        <DashboardSection
          title="Attendance records"
          subtitle={`${filtered.length} of ${allRows.length} row${
            allRows.length === 1 ? "" : "s"
          } · ${formatRangeLabel(range.from, range.to)}`}
        >
          <AttendanceFilters
            query={query}
            onQueryChange={setQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            methodFilter={methodFilter}
            onMethodFilterChange={setMethodFilter}
            planFilter={planFilter}
            planOptions={planOptions}
            onPlanFilterChange={setPlanFilter}
            filtersActive={filtersActive}
            onClearFilters={clearFilters}
          />

          <AttendanceRecordsTable
            rows={pageRows}
            totalCount={sorted.length}
            page={currentPage}
            pageCount={pageCount}
            pageSize={PAGE_SIZE}
            loading={status === "loading"}
            error={status === "error" ? error : null}
            onRetry={() => load("initial")}
            empty={showEmpty}
            noResults={showNoResults}
            onClearFilters={clearFilters}
            onMarkAttendance={() => openDrawer()}
            sortKey={sortKey}
            sortDir={sortDir}
            onToggleSort={toggleSort}
            onPageChange={setPage}
            onCheckOut={(row) => openDrawer(row.memberId, row.date)}
            onViewMember={() => router.push("/members")}
          />
        </DashboardSection>
      ) : (
        <BiometricAttendancePanel
          device={device}
          enrollments={enrollments}
          members={members}
          loading={status === "loading"}
          onRefresh={() => load("refresh")}
          onNotifyUnavailable={(message) =>
            toast.info("Device integration", message ?? "Not available yet.")
          }
        />
      )}

      <ManualAttendanceDrawer
        open={drawer.open}
        members={members}
        memberships={memberships}
        records={records}
        defaultDate={drawer.defaultDate}
        presetMemberId={drawer.presetMemberId}
        onOpenChange={(open) => setDrawer((current) => ({ ...current, open }))}
        onSaved={() => load("refresh")}
      />
    </div>
  );
}

/** Lightweight local wrapper so the records tab matches the dashboard card chrome. */
function DashboardSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-fade-up mt-5 rounded-card border border-line bg-card p-5 shadow-card">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
            <ScrollText className="size-4.5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
            <p className="mt-0.5 truncate text-xs text-faint">{subtitle}</p>
          </div>
        </div>
      </header>
      {children}
    </section>
  );
}
