"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Mail,
  Phone,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserPlus,
  UserRound,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import {
  SUPER_ADMIN_PATH,
  listPlatformGyms,
  type PlatformGym,
  type PlatformGymList,
  type PlatformSubscriptionStatus,
} from "@/lib/api";
import { formatNumber } from "@/lib/format";
import {
  formatPaise,
  formatPlatformDate,
  platformInitials,
  platformStatusMeta,
} from "@/lib/super-admin-view";
import { CreateGymOwnerDialog } from "./CreateGymOwnerDialog";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: Array<{
  value: PlatformSubscriptionStatus | "";
  label: string;
}> = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "TRIALING", label: "On trial" },
  { value: "EXPIRED", label: "Expired" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PAST_DUE", label: "Past due" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SUBSCRIPTION", label: "No subscription" },
];

type SortValue = "newest" | "oldest" | "name";

function planLabel(gym: PlatformGym): string {
  return (
    gym.subscription?.plan?.name ??
    gym.subscription?.planNameSnapshot ??
    (gym.effectiveStatus === "TRIALING" ? "Free trial" : "No plan")
  );
}

export function PlatformGymsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<PlatformSubscriptionStatus | "">("");
  const [sort, setSort] = useState<SortValue>("newest");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PlatformGymList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);

    listPlatformGyms(
      {
        q: debouncedSearch || undefined,
        status: status || undefined,
        sort,
        page,
        limit: PAGE_SIZE,
      },
      controller.signal,
    )
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Couldn't load gyms.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedSearch, status, sort, page, reloadKey]);

  const gyms = data?.gyms ?? [];
  const pagination = data?.pagination;
  const hasFilters = Boolean(debouncedSearch || status);

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("");
    setSort("newest");
    setPage(1);
  };

  const rangeStart = pagination
    ? (pagination.page - 1) * pagination.limit + 1
    : 0;
  const rangeEnd = pagination
    ? Math.min(rangeStart + gyms.length - 1, pagination.total)
    : 0;

  const empty = useMemo(
    () => !loading && !error && gyms.length === 0,
    [loading, error, gyms.length],
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <Building2 className="size-4.5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
                Gyms
              </h1>
              <p className="mt-1 text-sm text-subtle">
                Every tenant, owner and subscription on the platform.
              </p>
            </div>
          </div>
          {pagination && (
            <p className="mt-3 text-[11px] text-faint">
              {formatNumber(pagination.total)} gym
              {pagination.total === 1 ? "" : "s"} matched
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="md" onClick={reload} disabled={loading}>
            <RefreshCw
              className={cn("size-4", loading && "animate-spin")}
              strokeWidth={2}
              aria-hidden
            />
            Refresh
          </Button>
          <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
            <UserPlus className="size-4" strokeWidth={2} aria-hidden />
            Create gym owner
          </Button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-card/60 p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_190px_160px]">
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
              placeholder="Search gym name, ID, owner, email or phone…"
              aria-label="Search gyms"
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as PlatformSubscriptionStatus | "");
              setPage(1);
            }}
            aria-label="Filter by subscription status"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as SortValue);
              setPage(1);
            }}
            aria-label="Sort gyms"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </Select>
        </div>
        {hasFilters && (
          <div className="mt-3 flex items-center gap-2">
            <SlidersHorizontal className="size-3.5 text-faint" strokeWidth={1.75} aria-hidden />
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

      {error && (
        <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-subtle">{error}</p>
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
      ) : empty ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-line bg-card/40 px-6 py-14 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold/10 text-gold ring-1 ring-inset ring-gold/20">
            <Building2 className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="mt-4 text-sm font-semibold text-ink">
            {hasFilters ? "No gyms match these filters" : "No gyms registered yet"}
          </p>
          <p className="mt-1 max-w-sm text-sm text-subtle">
            {hasFilters
              ? "Try a different search term or clear the status filter."
              : "Gyms appear here as soon as owners finish onboarding."}
          </p>
          {hasFilters && (
            <Button variant="secondary" size="md" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-line/80 lg:block">
            <table className="w-full min-w-[1080px] divide-y divide-line/60">
              <thead>
                <tr className="bg-card-hover/40">
                  {[
                    "Gym",
                    "Owner",
                    "Plan",
                    "Status",
                    "Registered",
                    "Expiry",
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
                {gyms.map((gym) => {
                  const meta = platformStatusMeta(gym.effectiveStatus);
                  const href = `${SUPER_ADMIN_PATH}/gyms/details?gymId=${encodeURIComponent(
                    gym.id,
                  )}`;
                  return (
                    <tr key={gym.id} className="transition-colors hover:bg-card-hover/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            initials={platformInitials(gym.name)}
                            index={gym.name.charCodeAt(0) % 4}
                            className="size-9"
                          />
                          <div className="min-w-0">
                            <Link
                              href={href}
                              className="block truncate text-[13px] font-medium text-ink hover:text-gold"
                            >
                              {gym.name}
                            </Link>
                            <p className="truncate font-mono text-[10.5px] text-faint">
                              {gym.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {gym.owner ? (
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] text-ink">
                              {gym.owner.name}
                            </p>
                            <p className="truncate text-[10.5px] text-faint">
                              {gym.owner.email}
                            </p>
                            {gym.owner.phone && (
                              <p className="truncate text-[10.5px] text-faint">
                                {gym.owner.phone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[12px] text-faint">No owner account</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[12.5px] text-ink">{planLabel(gym)}</p>
                        {gym.subscription && (
                          <p className="text-[10.5px] text-faint">
                            {formatPaise(gym.subscription.pricePaise)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={meta.tone} dot>
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-subtle">
                        {formatPlatformDate(gym.registeredAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="text-[12px] text-subtle">
                          {formatPlatformDate(gym.expiryDate)}
                        </p>
                        {gym.subscription && gym.expiryDate && (
                          <p className="text-[10.5px] text-faint">
                            {gym.subscription.remainingDays === 0
                              ? "expired"
                              : `${gym.subscription.remainingDays}d left`}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={href}
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-gold hover:text-gold-bright"
                        >
                          Manage
                          <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="mt-4 space-y-3 lg:hidden">
            {gyms.map((gym) => {
              const meta = platformStatusMeta(gym.effectiveStatus);
              const href = `${SUPER_ADMIN_PATH}/gyms/details?gymId=${encodeURIComponent(
                gym.id,
              )}`;
              return (
                <li
                  key={gym.id}
                  className="rounded-xl border border-line bg-card/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        initials={platformInitials(gym.name)}
                        index={gym.name.charCodeAt(0) % 4}
                        className="size-9"
                      />
                      <div className="min-w-0">
                        <Link
                          href={href}
                          className="block truncate text-[13.5px] font-medium text-ink"
                        >
                          {gym.name}
                        </Link>
                        <p className="truncate font-mono text-[10.5px] text-faint">
                          {gym.id}
                        </p>
                      </div>
                    </div>
                    <Badge tone={meta.tone} dot>
                      {meta.label}
                    </Badge>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line/50 pt-3 text-[11.5px]">
                    <div className="col-span-2">
                      <dt className="text-faint">Owner</dt>
                      <dd className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-subtle">
                        <span className="inline-flex items-center gap-1">
                          <UserRound className="size-3" strokeWidth={1.75} aria-hidden />
                          {gym.owner?.name ?? "No owner"}
                        </span>
                        {gym.owner?.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="size-3" strokeWidth={1.75} aria-hidden />
                            {gym.owner.email}
                          </span>
                        )}
                        {gym.owner?.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="size-3" strokeWidth={1.75} aria-hidden />
                            {gym.owner.phone}
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-faint">Plan</dt>
                      <dd className="mt-0.5 text-subtle">{planLabel(gym)}</dd>
                    </div>
                    <div>
                      <dt className="text-faint">Expiry</dt>
                      <dd className="mt-0.5 text-subtle">
                        {formatPlatformDate(gym.expiryDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-faint">Registered</dt>
                      <dd className="mt-0.5 text-subtle">
                        {formatPlatformDate(gym.registeredAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-faint">Members</dt>
                      <dd className="mt-0.5 text-subtle">{gym.memberCount}</dd>
                    </div>
                  </dl>

                  <div className="mt-3 border-t border-line/50 pt-3">
                    <Link
                      href={href}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 text-[12px] font-medium text-gold"
                    >
                      Manage subscription
                      <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>

          {pagination && pagination.total > 0 && (
            <div className="mt-4 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-faint">
                Showing{" "}
                <span className="font-medium tabular-nums text-subtle">
                  {rangeStart}–{rangeEnd}
                </span>{" "}
                of{" "}
                <span className="font-medium tabular-nums text-subtle">
                  {pagination.total}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-3.5" strokeWidth={2} aria-hidden />
                  Prev
                </Button>
                <span className="text-xs tabular-nums text-subtle">
                  Page {pagination.page} of {Math.max(1, pagination.totalPages)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-5 flex items-center gap-2 text-[11px] text-faint">
        <ChevronsUpDown className="size-3.5" strokeWidth={1.75} aria-hidden />
        Search covers gym name, gym ID, owner name, owner email and phone.
      </div>

      <CreateGymOwnerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setSearch("");
          setDebouncedSearch("");
          setStatus("");
          setSort("newest");
          setPage(1);
          reload();
        }}
      />
    </div>
  );
}
