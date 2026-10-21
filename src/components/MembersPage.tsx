"use client";

import {
  Archive,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Download,
  Eye,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserPlus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  MEMBER_EVENTS,
  emitMemberArchived,
  onMemberEvent,
  openCreateMember,
  openEditMember,
} from "@/lib/events";
import { formatShortDate } from "@/lib/format";
import {
  archiveMember,
  getInitials,
  listMembers,
  listPlans,
  toMemberRow,
  type MemberDto,
  type MemberRow,
  type MemberStatus,
  type PlanDto,
} from "@/lib/members-api";
import { statusTone } from "@/lib/member-ui";
import { useToast } from "./providers/ToastProvider";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { DashboardCard } from "./DashboardCard";
import { MemberDetailsDrawer } from "./MemberDetailsDrawer";

const STATUSES: ("All" | MemberStatus)[] = [
  "All",
  "Active",
  "Expiring",
  "Inactive",
  "Frozen",
];

const STATUS_ORDER: Record<MemberStatus, number> = {
  Active: 0,
  Expiring: 1,
  Frozen: 2,
  Inactive: 3,
};

type SortKey = "name" | "plan" | "status" | "joined" | "nextDue";
type SortDir = "asc" | "desc";

export function MembersPage() {
  const toast = useToast();

  const [members, setMembers] = useState<MemberDto[]>([]);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | MemberStatus>("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [viewMember, setViewMember] = useState<MemberDto | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<MemberDto | null>(null);
  const [archiving, setArchiving] = useState(false);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "initial") {
        setStatus("loading");
        setError(null);
      } else {
        setRefreshing(true);
      }
      try {
        const [memberData, planData] = await Promise.all([
          listMembers(),
          listPlans().catch(() => [] as PlanDto[]),
        ]);
        setMembers(memberData);
        setPlans(planData);
        setStatus("ready");
      } catch (caught) {
        const message =
          caught instanceof ApiError
            ? caught.message
            : "Couldn't load members. Please try again.";
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

  // Refresh whenever a member mutation happens anywhere in the app.
  useEffect(() => {
    const events = [MEMBER_EVENTS.created, MEMBER_EVENTS.updated, MEMBER_EVENTS.archived];
    const offs = events.map((event) => onMemberEvent(event, () => load("refresh")));
    return () => offs.forEach((off) => off());
  }, [load]);

  const rows = useMemo(() => members.map(toMemberRow), [members]);

  const planOptions = useMemo(() => {
    const set = new Set<string>();
    plans.forEach((plan) => set.add(plan.name));
    rows.forEach((row) => row.plan && set.add(row.plan));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [plans, rows]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        !term ||
        `${row.name} ${row.email} ${row.phone} ${row.plan} ${row.code}`
          .toLowerCase()
          .includes(term);
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      const matchesPlan = planFilter === "All" || row.plan === planFilter;
      return matchesQuery && matchesStatus && matchesPlan;
    });
  }, [rows, query, statusFilter, planFilter]);

  const sorted = useMemo(() => {
    const direction = sortDir === "asc" ? 1 : -1;
    const compare = (a: MemberRow, b: MemberRow): number => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name) * direction;
        case "plan":
          return a.plan.localeCompare(b.plan) * direction;
        case "status":
          return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) * direction;
        case "nextDue": {
          const av = a.nextDue ? new Date(a.nextDue).getTime() : 0;
          const bv = b.nextDue ? new Date(b.nextDue).getTime() : 0;
          return (av - bv) * direction;
        }
        case "joined":
        default:
          return (
            (new Date(a.joined).getTime() - new Date(b.joined).getTime()) * direction
          );
      }
    };
    return [...filtered].sort(compare);
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, planFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "joined" ? "desc" : "asc");
    }
  };

  const filtersActive = query.trim() !== "" || statusFilter !== "All" || planFilter !== "All";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("All");
    setPlanFilter("All");
  };

  const exportCsv = () => {
    const header = ["Code", "Name", "Email", "Phone", "Plan", "Status", "Joined", "Next due"];
    const lines = filtered.map((row) => [
      row.code,
      row.name,
      row.email,
      row.phone,
      row.plan,
      row.status,
      row.joined.slice(0, 10),
      row.nextDue ? row.nextDue.slice(0, 10) : "",
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
    anchor.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Export ready", `${filtered.length} member(s) exported to CSV.`);
  };

  const handleArchive = useCallback(
    async (target: MemberDto | null) => {
      if (!target) return;
      setArchiving(true);
      try {
        await toast.promise(archiveMember(target.id), {
          loading: {
            title: "Archiving member…",
            description: "Removing the member from your active roster.",
          },
          success: {
            title: "Member archived",
            description: `${target.name} was removed from the roster.`,
          },
          error: (caught) => ({
            title: "Couldn't archive member",
            description:
              caught instanceof ApiError ? caught.message : "Please try again.",
          }),
        });
        setArchiveTarget(null);
        setViewMember((current) => (current?.id === target.id ? null : current));
        emitMemberArchived(target.id);
      } catch {
        // The toast already explains the failure; keep the dialog open to retry.
      } finally {
        setArchiving(false);
      }
    },
    [toast],
  );

  const showEmpty = status === "ready" && members.length === 0;
  const showNoResults = status === "ready" && members.length > 0 && filtered.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="animate-fade-up">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
            Members
          </h1>
          <p className="mt-1.5 text-sm text-subtle">
            Manage your member roster, memberships, and billing.
          </p>
        </div>
        <div className="animate-fade-up flex flex-wrap gap-2.5" style={{ animationDelay: "80ms" }}>
          <Button variant="secondary" size="md" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="size-4" strokeWidth={1.75} aria-hidden />
            Export
          </Button>
          <Button variant="primary" size="md" onClick={openCreateMember}>
            <UserPlus className="size-4" strokeWidth={2} aria-hidden />
            Add member
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:mt-8">
        <DashboardCard
          title="Member directory"
          subtitle={`${filtered.length} of ${members.length} member${members.length === 1 ? "" : "s"}`}
          icon={Users}
          delay={40}
          action={
            <Button
              variant="secondary"
              size="md"
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
          }
        >
          {/* Toolbar */}
          <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, email, phone, code…"
                  aria-label="Search members"
                  className="h-9 w-full rounded-lg border border-line bg-card pr-3 pl-9 text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-gold/50"
                />
              </div>
              <div className="relative">
                <SlidersHorizontal
                  className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <select
                  value={planFilter}
                  onChange={(event) => setPlanFilter(event.target.value)}
                  aria-label="Filter by plan"
                  className="h-9 w-full appearance-none rounded-lg border border-line bg-card pr-8 pl-9 text-[13px] text-ink outline-none transition-colors focus:border-gold/50 sm:w-48"
                >
                  <option value="All">All plans</option>
                  {planOptions.map((plan) => (
                    <option key={plan} value={plan}>
                      {plan}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {STATUSES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStatusFilter(item)}
                  aria-pressed={statusFilter === item}
                  className={cn(
                    "h-8 rounded-lg px-3 text-xs font-medium transition-colors",
                    statusFilter === item
                      ? "gold-surface text-[#1A1503] shadow-gold"
                      : "border border-line bg-card text-subtle hover:bg-card-hover hover:text-ink",
                  )}
                >
                  {item}
                </button>
              ))}
              {filtersActive && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-8 rounded-lg px-3 text-xs font-medium text-gold transition-colors hover:bg-gold/10"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="mt-5 overflow-x-auto rounded-xl border border-line/80">
            <table className="w-full min-w-[920px] divide-y divide-line/60">
              <thead>
                <tr className="bg-card-hover/40">
                  <SortHeader label="Member" sortKey="name" active={sortKey} dir={sortDir} onSort={toggleSort} />
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Contact
                  </th>
                  <SortHeader label="Plan" sortKey="plan" active={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Status" sortKey="status" active={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Joined" sortKey="joined" active={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Next due" sortKey="nextDue" active={sortKey} dir={sortDir} onSort={toggleSort} />
                  <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 bg-card/60">
                {status === "loading" &&
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="animate-pulse">
                      {Array.from({ length: 7 }).map((__, cell) => (
                        <td key={cell} className="px-4 py-3.5">
                          <div className="h-3.5 rounded bg-card-hover" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {status === "ready" &&
                  pageRows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-card-hover/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            initials={getInitials(row.name)}
                            index={row.id.charCodeAt(row.id.length - 1) % 4}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">{row.name}</p>
                            <p className="truncate font-mono text-[11px] text-faint">{row.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-subtle">
                            <Mail className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                            <span className="truncate">{row.email || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-subtle">
                            <Phone className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                            <span className="truncate">{row.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="gold">{row.plan}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(row.status)} dot>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-subtle">
                        {formatShortDate(row.joined.slice(0, 10))}
                      </td>
                      <td className="px-4 py-3 text-xs text-subtle">
                        {row.nextDue ? formatShortDate(row.nextDue.slice(0, 10)) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMember(row.raw)}
                            aria-label={`View ${row.name}`}
                          >
                            <Eye className="size-3.5" strokeWidth={1.75} aria-hidden />
                            View
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditMember(row.raw)}
                            aria-label={`Edit ${row.name}`}
                          >
                            <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                            Edit
                          </Button>
                          <RowActionMenu
                            onArchive={() => setArchiveTarget(row.raw)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Error state */}
          {status === "error" && (
            <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-semibold text-ink">Couldn&apos;t load members</p>
              <p className="mt-1 max-w-md text-sm text-subtle">{error}</p>
              <Button variant="primary" size="md" className="mt-4" onClick={() => load("initial")}>
                <RefreshCw className="size-4" strokeWidth={2} aria-hidden />
                Try again
              </Button>
            </div>
          )}

          {/* Empty state (no members at all) */}
          {showEmpty && (
            <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold/10 text-gold ring-1 ring-inset ring-gold/20">
                <Users className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <p className="mt-4 text-sm font-semibold text-ink">No members yet</p>
              <p className="mt-1 max-w-sm text-sm text-subtle">
                Add your first member to get the roster started.
              </p>
              <Button variant="primary" size="md" className="mt-4" onClick={openCreateMember}>
                <Plus className="size-4" strokeWidth={2} aria-hidden />
                Add member
              </Button>
            </div>
          )}

          {/* No results state */}
          {showNoResults && (
            <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-ink">No members found</p>
              <p className="mt-1 text-sm text-subtle">Try adjusting your search or filters.</p>
              <Button variant="secondary" size="md" className="mt-4" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          {status === "ready" && filtered.length > 0 && (
            <div className="mt-4 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-faint">
                Showing{" "}
                <span className="font-medium tabular-nums text-subtle">
                  {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, sorted.length)}
                </span>{" "}
                of <span className="font-medium tabular-nums text-subtle">{sorted.length}</span>
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
          )}
        </DashboardCard>
      </div>

      <MemberDetailsDrawer
        member={viewMember}
        open={Boolean(viewMember)}
        onOpenChange={(open) => !open && setViewMember(null)}
        onEdit={(target) => {
          setViewMember(null);
          openEditMember(target);
        }}
        onArchive={(target) => setArchiveTarget(target)}
      />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Archive this member?"
        description={
          archiveTarget
            ? `${archiveTarget.name} will be archived and hidden from the roster. Their membership and payment history is kept.`
            : undefined
        }
        confirmLabel="Archive member"
        loading={archiving}
        onConfirm={() => handleArchive(archiveTarget)}
        onCancel={() => !archiving && setArchiveTarget(null)}
      />
    </div>
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
  sortKey: SortKey;
  active: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
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

function RowActionMenu({ onArchive }: { onArchive: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-card-hover hover:text-ink"
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-30 w-40 animate-pop overflow-hidden rounded-xl border border-line-strong bg-elevated py-1.5 shadow-pop"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onArchive();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] text-danger transition-colors hover:bg-danger/10"
          >
            <Archive className="size-3.5" strokeWidth={1.75} aria-hidden />
            Archive
          </button>
        </div>
      )}
    </div>
  );
}
