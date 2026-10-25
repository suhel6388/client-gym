"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  History,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { fetchPlatformActivity, type PlatformAuditLog } from "@/lib/api";
import { auditActionLabel } from "@/lib/super-admin-view";
import { PlatformAuditList } from "./PlatformAuditList";

export function PlatformActivityPage() {
  const [logs, setLogs] = useState<PlatformAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);

    fetchPlatformActivity(100, controller.signal)
      .then((result) => {
        if (active) setLogs(result);
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Couldn't load activity.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((log) =>
      [
        auditActionLabel(log.action),
        log.action,
        log.gymId ?? "",
        log.actorEmail ?? "",
        log.actorRole ?? "",
        log.reason ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [logs, search]);

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <History className="size-4.5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
                Activity
              </h1>
              <p className="mt-1 text-sm text-subtle">
                Platform administration audit trail.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-faint">
            Showing the latest {logs.length} entries · append-only
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={reload} disabled={loading}>
          <RefreshCw
            className={cn("size-4", loading && "animate-spin")}
            strokeWidth={2}
            aria-hidden
          />
          Refresh
        </Button>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-card/60 p-3 sm:p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint"
            strokeWidth={1.75}
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter by action, gym ID, actor or reason…"
            aria-label="Filter activity"
            className="pl-9"
          />
        </div>
        {search && (
          <p className="mt-2 text-[11px] text-faint">
            {filtered.length} of {logs.length} entries match.
          </p>
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

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-card/60">
        <div className="flex items-center gap-2 border-b border-line/60 px-5 py-3">
          <ShieldCheck className="size-3.5 text-gold" strokeWidth={1.75} aria-hidden />
          <p className="text-[11.5px] text-subtle">
            Every mutation on{" "}
            <span className="font-mono text-[10.5px] text-faint">
              /api/v1/super-admin
            </span>{" "}
            records the actor, role, reason and affected gym.
          </p>
        </div>
        {filtered.length === 0 && !loading && !error ? (
          <p className="px-5 py-14 text-center text-sm text-subtle">
            {search ? "No activity matches this filter." : "No admin activity yet."}
          </p>
        ) : (
          <PlatformAuditList
            logs={filtered}
            loading={loading}
            showGymId
            emptyLabel="No admin activity yet."
          />
        )}
      </div>
    </div>
  );
}
