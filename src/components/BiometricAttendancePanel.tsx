"use client";

import {
  Cpu,
  Fingerprint,
  Info,
  Link2,
  PlugZap,
  RefreshCw,
  ShieldAlert,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  DEVICE_INTEGRATION_AVAILABLE,
  type AttendanceDeviceDto,
  type AttendanceEnrollmentDto,
  type EnrollmentStatusDto,
} from "@/lib/attendance-api";
import { getInitials, type MemberDto } from "@/lib/members-api";
import { Avatar } from "./ui/Avatar";
import { Badge, type BadgeTone } from "./ui/Badge";
import { Button } from "./ui/Button";

const ENROLLMENT_TONES: Record<EnrollmentStatusDto, BadgeTone> = {
  SYNCED: "success",
  PENDING: "warning",
  NOT_ENROLLED: "muted",
};

const ENROLLMENT_LABELS: Record<EnrollmentStatusDto, string> = {
  SYNCED: "Synced",
  PENDING: "Pending",
  NOT_ENROLLED: "Not enrolled",
};

type BiometricAttendancePanelProps = {
  device: AttendanceDeviceDto | null;
  enrollments: AttendanceEnrollmentDto[];
  members: MemberDto[];
  loading: boolean;
  onRefresh: () => void;
  onNotifyUnavailable: (message?: string) => void;
};

export function BiometricAttendancePanel({
  device,
  enrollments,
  members,
  loading,
  onRefresh,
  onNotifyUnavailable,
}: BiometricAttendancePanelProps) {
  const memberById = new Map(members.map((member) => [member.id, member]));
  const visibleEnrollments = enrollments.slice(0, 50);

  return (
    <div className="mt-5 space-y-5">
      {/* Integration notice */}
      <div className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/[0.06] px-4 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />
        <div className="text-[12px] leading-relaxed text-gold-soft">
          <p className="font-semibold text-gold">Device integration is not connected</p>
          <p className="mt-0.5 text-subtle">
            The panel below shows the integration interface and demo data only. No fingerprint
            scans are verified and no device is online — connect a real adapter to enable biometric
            check-ins.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Device status */}
        <section className="rounded-card border border-line bg-card p-5 shadow-card xl:col-span-2">
          <header className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
                <Cpu className="size-4.5" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink">Device status</h3>
                <p className="mt-0.5 text-xs text-faint">
                  {device?.name ?? "No terminal configured"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={device?.connected ? "success" : "muted"} dot>
                {device?.connected ? "Connected" : "Not connected"}
              </Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                aria-label="Refresh device status"
              >
                <RefreshCw
                  className={cn("size-3.5", loading && "animate-spin")}
                  strokeWidth={1.75}
                  aria-hidden
                />
              </Button>
            </div>
          </header>

          {loading ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-lg bg-card-hover/50" />
              ))}
            </div>
          ) : (
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
              <StatusField label="Model" value={device?.model ?? "—"} />
              <StatusField label="Serial" value={device?.serial ?? "—"} mono />
              <StatusField label="IP address" value={device?.ipAddress ?? "—"} mono />
              <StatusField label="Firmware" value={device?.firmware ?? "—"} mono />
              <StatusField
                label="Last sync"
                value={device?.lastSyncAt ? device.lastSyncAt.slice(0, 16).replace("T", " ") : "Never"}
              />
              <StatusField
                label="Enrolled templates"
                value={device ? String(device.enrolledTemplates) : "0"}
              />
              <StatusField
                label="Pending sync"
                value={device ? String(device.pendingSyncCount) : "0"}
              />
              <StatusField
                label="Connection"
                value={device?.connected ? "Online" : "Offline"}
              />
            </dl>
          )}

          <div className="mt-5 flex flex-wrap gap-2 border-t border-line/50 pt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                onNotifyUnavailable("Device integration is not available in this build.")
              }
            >
              <PlugZap className="size-3.5" strokeWidth={1.75} aria-hidden />
              Test connection
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onNotifyUnavailable("Configure the device adapter before syncing.")
              }
            >
              <Link2 className="size-3.5" strokeWidth={1.75} aria-hidden />
              Configure device
            </Button>
          </div>
        </section>

        {/* Adapter contract */}
        <section className="rounded-card border border-line bg-card p-5 shadow-card">
          <header className="flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <Fingerprint className="size-4.5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink">Adapter interface</h3>
              <p className="mt-0.5 text-xs text-faint">Ready for a real device</p>
            </div>
          </header>

          <ul className="mt-4 space-y-2.5 text-[12px]">
            {[
              { name: "connect()", detail: "Open the device session" },
              { name: "onScan(cb)", detail: "Stream fingerprint matches" },
              { name: "enroll(memberId, finger)", detail: "Register a template" },
              { name: "sync()", detail: "Push/pull the template queue" },
            ].map((item) => (
              <li key={item.name} className="flex items-start justify-between gap-3">
                <code className="rounded-md bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-gold-soft">
                  {item.name}
                </code>
                <span className="text-right text-faint">{item.detail}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-card-hover/20 px-3 py-2.5 text-[11px] text-subtle">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-faint" strokeWidth={1.75} aria-hidden />
            <span>
              {DEVICE_INTEGRATION_AVAILABLE
                ? "Adapter available."
                : "No adapter registered. Scan events are intentionally not simulated."}
            </span>
          </div>
        </section>
      </div>

      {/* Enrollment mapping */}
      <section className="rounded-card border border-line bg-card p-5 shadow-card">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <Fingerprint className="size-4.5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-ink">Member fingerprint mapping</h3>
              <p className="mt-0.5 text-xs text-faint">
                {enrollments.length} member{enrollments.length === 1 ? "" : "s"} · demo data
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNotifyUnavailable("Enrollment requires a connected device.")}
          >
            <PlugZap className="size-3.5" strokeWidth={1.75} aria-hidden />
            Enroll member
          </Button>
        </header>

        {loading ? (
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-lg bg-card-hover/50" />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center py-10 text-center">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-card-hover/50 text-faint">
              <WifiOff className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <p className="mt-3 text-sm font-medium text-ink">No enrollments yet</p>
            <p className="mt-1 max-w-sm text-xs text-subtle">
              Fingerprint templates will appear here once a device adapter is connected.
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-xl border border-line/80">
            <table className="w-full min-w-[720px] divide-y divide-line/60">
              <thead>
                <tr className="bg-card-hover/40">
                  {["Member", "Finger", "Template ID", "Enrolled", "Status"].map((label) => (
                    <th
                      key={label}
                      className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint"
                    >
                      {label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 bg-card/60">
                {visibleEnrollments.map((enrollment) => {
                  const member = memberById.get(enrollment.memberId);
                  return (
                    <tr key={enrollment.id} className="transition-colors hover:bg-card-hover/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            initials={getInitials(member?.name ?? "?")}
                            className="size-8 text-[10px]"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-ink">
                              {member?.name ?? "Unknown member"}
                            </p>
                            <p className="truncate font-mono text-[11px] text-faint">
                              {member?.memberCode ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-subtle">{enrollment.finger}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-subtle">
                        {enrollment.templateId || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-subtle">
                        {enrollment.status === "NOT_ENROLLED"
                          ? "—"
                          : enrollment.enrolledAt.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={ENROLLMENT_TONES[enrollment.status]} dot>
                          {ENROLLMENT_LABELS[enrollment.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          title="Requires a connected device"
                          aria-label="Re-enroll fingerprint (unavailable)"
                        >
                          Re-enroll
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {enrollments.length > visibleEnrollments.length && (
              <p className="border-t border-line/60 px-4 py-2.5 text-[11px] text-faint">
                Showing {visibleEnrollments.length} of {enrollments.length} members.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.12em] text-faint">{label}</dt>
      <dd className={cn("mt-1 text-[13px] text-ink", mono && "font-mono text-[12px]")}>
        {value}
      </dd>
    </div>
  );
}
