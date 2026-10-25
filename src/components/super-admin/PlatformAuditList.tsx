"use client";

import { History } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import type { PlatformAuditLog } from "@/lib/api";
import {
  auditActionLabel,
  auditActionTone,
  formatPlatformDateTime,
  formatRelativeTime,
} from "@/lib/super-admin-view";

type PlatformAuditListProps = {
  logs: PlatformAuditLog[];
  loading?: boolean;
  showGymId?: boolean;
  emptyLabel?: string;
  className?: string;
};

/** Vertical audit timeline shared by the gym detail page and activity page. */
export function PlatformAuditList({
  logs,
  loading = false,
  showGymId = false,
  emptyLabel = "No administrative actions recorded yet.",
  className,
}: PlatformAuditListProps) {
  if (loading) {
    return (
      <div className={cn("space-y-3 p-5", className)}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse rounded-lg bg-card-hover/50" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className={cn("flex flex-col items-center px-5 py-10 text-center", className)}>
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-card-hover text-faint">
          <History className="size-4.5" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="mt-3 text-sm text-subtle">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <ol className={cn("relative px-5 py-4", className)}>
      <span
        aria-hidden
        className="absolute left-[27px] top-6 bottom-6 w-px bg-line/70"
      />
      {logs.map((log) => (
        <li key={log.id} className="relative flex gap-3 py-2.5">
          <span
            aria-hidden
            className={cn(
              "relative z-10 mt-1 size-2.5 shrink-0 rounded-full ring-4 ring-card",
              log.action.includes("SUSPEND") || log.action.includes("FAILED")
                ? "bg-danger"
                : log.action.includes("ACTIV") ||
                    log.action.includes("ASSIGN") ||
                    log.action.includes("EXTEND")
                  ? "bg-success"
                  : log.action.includes("TRIAL")
                    ? "bg-gold"
                    : "bg-faint",
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={auditActionTone(log.action)}>
                {auditActionLabel(log.action)}
              </Badge>
              {showGymId && log.gymId && (
                <span className="truncate font-mono text-[10px] text-faint">
                  {log.gymId}
                </span>
              )}
              <span
                className="ml-auto shrink-0 text-[10.5px] text-faint"
                title={formatPlatformDateTime(log.createdAt)}
              >
                {formatRelativeTime(log.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-subtle">
              {log.reason || "No reason recorded."}
            </p>
            <p className="mt-0.5 truncate text-[10.5px] text-faint">
              {log.actorEmail ?? "System"}
              {log.actorRole ? ` · ${log.actorRole}` : ""} ·{" "}
              {formatPlatformDateTime(log.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
