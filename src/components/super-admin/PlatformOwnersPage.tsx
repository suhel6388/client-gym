"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
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
  listPlatformOwners,
  type PlatformGymSort,
  type PlatformOwnerList,
} from "@/lib/api";
import { formatNumber } from "@/lib/format";
import {
  formatPlatformDate,
  platformInitials,
  platformStatusMeta,
} from "@/lib/super-admin-view";
import { CreateGymOwnerDialog } from "./CreateGymOwnerDialog";

const PAGE_SIZE = 20;

type SortValue = Extract<PlatformGymSort, "newest" | "oldest" | "name">;

/**
 * Owner directory for the platform console. The gym directory already shows
 * the owner column; this view makes owners themselves searchable and paginated
 * (name, email, phone, gym name, gym id).
 */
export function PlatformOwnersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortValue>("newest");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PlatformOwnerList | null>(null);
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

    listPlatformOwners(
      {
        q: debouncedSearch || undefined,
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
        setError(
          err instanceof Error ? err.message : "Couldn't load gym owners.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedSearch, sort, page, reloadKey]);

  const owners = data?.owners ?? [];
  const pagination = data?.pagination;
  const hasFilters = Boolean(debouncedSearch);
  const empty = useMemo(
    () => !loading && !error && owners.length === 0,
    [loading, error, owners.length],
  );

  const rangeStart = pagination
    ? (pagination.page - 1) * pagination.limit + 1
    : 0;
  const rangeEnd = pagination
    ? Math.min(rangeStart + owners.length - 1, pagination.total)
    : 0;

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSort("newest");
    setPage(1);
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <UserRound className="size-4.5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
                Gym owners
              </h1>
              <p className="mt-1 text-sm text-subtle">
                Every OWNER account, its gym and SaaS subscription.
              </p>
            </div>
          </div>
          {pagination && (
            <p className="mt-3 text-[11px] text-faint">
              {formatNumber(pagination.total)} owner
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
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_170px]">
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
              placeholder="Search owner name, email, phone, gym name or gym ID…"
              aria-label="Search gym owners"
              className="pl-9"
            />
          </div>
          <Select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as SortValue);
              setPage(1);
            }}
            aria-label="Sort owners"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </Select>
        </div>
        {hasFilters && (
          <div className="mt-3 flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-faint" strokeWidth={1.75} aria-hidden />
            <span className="text-[11px] text-faint">Filter active</span>
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
            <UserRound className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="mt-4 text-sm font-semibold text-ink">
            {hasFilters ? "No owners match this search" : "No gym owners yet"}
          </p>
          <p className="mt-1 max-w-sm text-sm text-subtle">
            {hasFilters
              ? "Try a different name, email, phone or gym name."
              : "Create the first gym owner to give a gym an OWNER account."}
          </p>
          {hasFilters ? (
            <Button variant="secondary" size="md" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              className="mt-4"
              onClick={() => setCreateOpen(true)}
            >
              <UserPlus className="size-4" strokeWidth={2} aria-hidden />
              Create gym owner
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-line/80 lg:block">
            <table className="w-full min-w-[980px] divide-y divide-line/60">
              <thead>
                <tr className="bg-card-hover/40">
                  {["Owner", "Gym", "Plan", "Status", "Expiry", "Joined"].map(
                    (label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-faint"
                      >
                        {label}
                      </th>
                    ),
                  )}
                  <th className="px-4 py-3 text-right text-[10.5px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 bg-card/50">
                {owners.map((owner) => {
                  const meta = platformStatusMeta(
                    owner.subscription?.effectiveStatus ?? "NO_SUBSCRIPTION",
                  );
                  const gymHref = owner.gym
                    ? `${SUPER_ADMIN_PATH}/gyms/details?gymId=${encodeURIComponent(
                        owner.gym.id,
                      )}`
                    : null;
                  return (
                    <tr
                      key={owner.id}
                      className="transition-colors hover:bg-card-hover/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            initials={platformInitials(owner.name)}
                            index={owner.name.charCodeAt(0) % 4}
                            className="size-9"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-ink">
                              {owner.name}
                            </p>
                            <p className="truncate text-[10.5px] text-faint">
                              {owner.email}
                            </p>
                            {owner.phone && (
                              <p className="truncate text-[10.5px] text-faint">
                                {owner.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {owner.gym ? (
                          <>
                            <Link
                              href={gymHref!}
                              className="block truncate text-[12.5px] text-ink hover:text-gold"
                            >
                              {owner.gym.name}
                            </Link>
                            <p className="truncate font-mono text-[10.5px] text-faint">
                              {owner.gym.id}
                            </p>
                          </>
                        ) : (
                          <span className="text-[12px] text-faint">
                            No gym linked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-ink">
                        {owner.subscription?.planName ?? "No plan"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={meta.tone} dot>
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-subtle">
                        {formatPlatformDate(owner.subscription?.expiresAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-subtle">
                        {formatPlatformDate(owner.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {gymHref ? (
                          <Link
                            href={gymHref}
                            className="inline-flex items-center gap-1 text-[12px] font-medium text-gold hover:text-gold-bright"
                          >
                            Manage
                            <ChevronRight
                              className="size-3.5"
                              strokeWidth={2}
                              aria-hidden
                            />
                          </Link>
                        ) : (
                          <span className="text-[11px] text-faint">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 space-y-3 lg:hidden">
            {owners.map((owner) => {
              const meta = platformStatusMeta(
                owner.subscription?.effectiveStatus ?? "NO_SUBSCRIPTION",
              );
              const gymHref = owner.gym
                ? `${SUPER_ADMIN_PATH}/gyms/details?gymId=${encodeURIComponent(
                    owner.gym.id,
                  )}`
                : null;
              return (
                <li
                  key={owner.id}
                  className="rounded-xl border border-line bg-card/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        initials={platformInitials(owner.name)}
                        index={owner.name.charCodeAt(0) % 4}
                        className="size-9"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium text-ink">
                          {owner.name}
                        </p>
                        <p className="truncate text-[10.5px] text-faint">
                          {owner.email}
                        </p>
                      </div>
                    </div>
                    <Badge tone={meta.tone} dot>
                      {meta.label}
                    </Badge>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line/50 pt-3 text-[11.5px]">
                    <div className="col-span-2">
                      <dt className="text-faint">Gym</dt>
                      <dd className="mt-0.5 text-subtle">
                        {owner.gym?.name ?? "No gym linked"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-faint">Plan</dt>
                      <dd className="mt-0.5 text-subtle">
                        {owner.subscription?.planName ?? "No plan"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-faint">Expiry</dt>
                      <dd className="mt-0.5 text-subtle">
                        {formatPlatformDate(owner.subscription?.expiresAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-faint">Phone</dt>
                      <dd className="mt-0.5 inline-flex items-center gap-1 text-subtle">
                        <Phone className="size-3" strokeWidth={1.75} aria-hidden />
                        {owner.phone ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-faint">Email</dt>
                      <dd className="mt-0.5 inline-flex items-center gap-1 text-subtle">
                        <Mail className="size-3" strokeWidth={1.75} aria-hidden />
                        {owner.email}
                      </dd>
                    </div>
                  </dl>

                  {gymHref && (
                    <div className="mt-3 border-t border-line/50 pt-3">
                      <Link
                        href={gymHref}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 text-[12px] font-medium text-gold"
                      >
                        <Building2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                        Manage gym
                        <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden />
                      </Link>
                    </div>
                  )}
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

      <CreateGymOwnerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setSearch("");
          setDebouncedSearch("");
          setSort("newest");
          setPage(1);
          reload();
        }}
      />
    </div>
  );
}
