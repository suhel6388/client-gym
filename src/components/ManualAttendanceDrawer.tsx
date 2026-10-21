"use client";

import {
  AlertTriangle,
  CalendarClock,
  Check,
  Fingerprint,
  Loader2,
  LogIn,
  LogOut,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  ATTENDANCE_DATA_SOURCE,
  recordCheckIn,
  recordCheckOut,
  type AttendanceRecordDto,
} from "@/lib/attendance-api";
import { formatTime, todayKey } from "@/lib/attendance-view";
import { toSubscriptionStatus } from "@/lib/membership-view";
import { getInitials, type MemberDto, type MembershipWithRelationsDto } from "@/lib/members-api";
import { useToast } from "./providers/ToastProvider";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

const FORM_ID = "manual-attendance-form";

type AttendanceAction = "in" | "out";

function nowTime(): string {
  const now = new Date();
  const hours = `${now.getHours()}`.padStart(2, "0");
  const minutes = `${now.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

type ManualAttendanceDrawerProps = {
  open: boolean;
  members: MemberDto[];
  memberships: MembershipWithRelationsDto[];
  /** All loaded records — used to detect duplicate / open check-ins. */
  records: AttendanceRecordDto[];
  defaultDate: string;
  presetMemberId?: string | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function ManualAttendanceDrawer({
  open,
  members,
  memberships,
  records,
  defaultDate,
  presetMemberId = null,
  onOpenChange,
  onSaved,
}: ManualAttendanceDrawerProps) {
  const toast = useToast();

  const [memberId, setMemberId] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(nowTime());
  const [action, setAction] = useState<AttendanceAction>("in");
  const [notes, setNotes] = useState("");
  const [historicalConfirmed, setHistoricalConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMemberId(presetMemberId ?? "");
    setMemberQuery("");
    setDate(defaultDate);
    setTime(nowTime());
    setAction("in");
    setNotes("");
    setHistoricalConfirmed(false);
    setErrors({});
    setServerError(null);
    setSubmitting(false);
  }, [open, defaultDate, presetMemberId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, submitting, onOpenChange]);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === memberId) ?? null,
    [members, memberId],
  );

  const selectedMembership = useMemo(() => {
    if (!memberId) return null;
    const list = memberships.filter((membership) => membership.memberId === memberId);
    if (!list.length) return null;
    return [...list].sort(
      (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
    )[0];
  }, [memberships, memberId]);

  const membershipStatus = selectedMembership ? toSubscriptionStatus(selectedMembership) : null;
  const membershipWarn =
    membershipStatus === "Expired" ||
    membershipStatus === "Frozen" ||
    membershipStatus === "Cancelled" ||
    membershipStatus === "Inactive";

  const filteredMembers = useMemo(() => {
    const term = memberQuery.trim().toLowerCase();
    const list = !term
      ? members
      : members.filter((member) =>
          `${member.name} ${member.memberCode} ${member.phone}`.toLowerCase().includes(term),
        );
    return list.slice(0, 8);
  }, [members, memberQuery]);

  // Current state for the selected member on the chosen date.
  const openRecord = useMemo(
    () =>
      records.find(
        (record) =>
          record.memberId === memberId &&
          record.date === date &&
          !record.checkOutAt,
      ) ?? null,
    [records, memberId, date],
  );
  const closedRecord = useMemo(
    () =>
      records.find(
        (record) =>
          record.memberId === memberId &&
          record.date === date &&
          record.checkOutAt,
      ) ?? null,
    [records, memberId, date],
  );

  // Default the action to check-out when the member is already inside.
  useEffect(() => {
    if (!open) return;
    if (openRecord) setAction("out");
    else setAction("in");
  }, [open, openRecord]);

  const isToday = date === todayKey();
  const isFuture = date > todayKey();

  const validate = useCallback((): Record<string, string> => {
    const found: Record<string, string> = {};
    if (!memberId) found.memberId = "Select a member.";
    if (!date) found.date = "Attendance date is required.";
    else if (isFuture) found.date = "Attendance can't be recorded for a future date.";
    if (!time) found.time = "Attendance time is required.";

    if (memberId && date && !isFuture) {
      if (action === "in" && (openRecord || closedRecord)) {
        found.action = "This member already has a check-in recorded for this date.";
      }
      if (action === "out" && !openRecord) {
        found.action = "No open check-in found to close for this date.";
      }
    }

    if (!isToday && date && !isFuture && !historicalConfirmed) {
      found.historical = "Confirm this is a historical entry.";
    }
    return found;
  }, [action, closedRecord, date, historicalConfirmed, isFuture, isToday, memberId, openRecord, time]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const found = validate();
      setErrors(found);
      if (Object.keys(found).length > 0) return;

      setServerError(null);
      setSubmitting(true);
      try {
        await toast.promise(
          (async () => {
            if (action === "in") {
              await recordCheckIn({
                memberId,
                date,
                time,
                notes: notes.trim() || null,
                method: "MANUAL",
              });
            } else {
              if (!openRecord) throw new Error("No open check-in to close.");
              await recordCheckOut({
                recordId: openRecord.id,
                memberId,
                time,
                notes: notes.trim() || null,
              });
            }
          })(),
          {
            loading: {
              title: action === "in" ? "Recording check-in…" : "Recording check-out…",
              description: "Saving the attendance entry.",
            },
            success: {
              title: action === "in" ? "Check-in recorded" : "Check-out recorded",
              description: selectedMember
                ? `${selectedMember.name} at ${time}${
                    ATTENDANCE_DATA_SOURCE === "demo" ? " (demo data)" : ""
                  }.`
                : undefined,
            },
            error: (caught) => ({
              title: "Couldn't save attendance",
              description:
                caught instanceof ApiError
                  ? caught.message
                  : caught instanceof Error
                    ? caught.message
                    : "Something went wrong. Please try again.",
            }),
          },
        );
        onSaved();
        onOpenChange(false);
      } catch (caught) {
        setServerError(
          caught instanceof ApiError
            ? caught.message
            : caught instanceof Error
              ? caught.message
              : "Something went wrong. Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      action,
      date,
      memberId,
      notes,
      onOpenChange,
      onSaved,
      openRecord,
      selectedMember,
      time,
      toast,
      validate,
    ],
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => !submitting && onOpenChange(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-card shadow-pop transition-transform duration-300 sm:max-w-lg",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-attendance-title"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line/60 px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <CalendarClock className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <h2 id="manual-attendance-title" className="text-sm font-semibold text-ink">
              Mark attendance
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            disabled={submitting}
            className="inline-flex size-8 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-card-hover hover:text-ink disabled:opacity-50"
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        <form
          id={FORM_ID}
          onSubmit={handleSubmit}
          className="scroll-thin flex-1 overflow-y-auto px-6 py-6"
        >
          {serverError && (
            <div className="mb-5 rounded-lg border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-xs font-medium text-danger">
              {serverError}
            </div>
          )}

          {ATTENDANCE_DATA_SOURCE === "demo" && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-gold/30 bg-gold/[0.08] px-3.5 py-2.5 text-[11px] text-gold-soft">
              <Fingerprint className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
              <span>
                Demo mode — attendance is stored locally until the attendance API is connected.
              </span>
            </div>
          )}

          {/* Member */}
          <div>
            <Label htmlFor="att-member">Member</Label>
            {selectedMember ? (
              <div className="mt-1.5 rounded-lg border border-line bg-card-hover/40 px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <Avatar
                    initials={getInitials(selectedMember.name)}
                    className="size-9"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {selectedMember.name}
                    </p>
                    <p className="truncate font-mono text-[11px] text-faint">
                      {selectedMember.memberCode} · {selectedMember.phone}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMemberId("")}
                    aria-label="Change member"
                    className="inline-flex size-7 items-center justify-center rounded-lg text-faint transition-colors hover:bg-card-hover hover:text-ink"
                  >
                    <X className="size-3.5" strokeWidth={1.75} aria-hidden />
                  </button>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line/50 pt-2.5">
                  <Badge tone="gold">{selectedMembership?.plan?.name ?? "No plan"}</Badge>
                  {membershipStatus && (
                    <Badge
                      tone={
                        membershipWarn
                          ? membershipStatus === "Frozen"
                            ? "neutral"
                            : "danger"
                          : "success"
                      }
                      dot
                    >
                      {membershipStatus}
                    </Badge>
                  )}
                  {selectedMembership && (
                    <span className="text-[11px] text-faint">
                      Expires {selectedMembership.endDate.slice(0, 10)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="relative mt-1.5">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <Input
                    id="att-member"
                    className="pl-9"
                    value={memberQuery}
                    onChange={(event) => setMemberQuery(event.target.value)}
                    placeholder="Search by name, phone or member ID"
                    aria-invalid={Boolean(errors.memberId)}
                    autoFocus
                  />
                </div>
                {errors.memberId && (
                  <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.memberId}</p>
                )}
                {members.length === 0 ? (
                  <p className="mt-2 text-[11px] text-faint">No members available.</p>
                ) : (
                  <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto scroll-thin">
                    {filteredMembers.map((member) => (
                      <li key={member.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setMemberId(member.id);
                            setErrors((current) => {
                              if (!current.memberId && !current.action) return current;
                              const next = { ...current };
                              delete next.memberId;
                              delete next.action;
                              return next;
                            });
                          }}
                          className="flex w-full items-center gap-3 rounded-lg border border-line/60 bg-card-hover/20 px-3 py-2 text-left transition-colors hover:border-line-strong hover:bg-card-hover/60"
                        >
                          <Avatar initials={getInitials(member.name)} className="size-8 text-[10px]" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-ink">
                              {member.name}
                            </p>
                            <p className="truncate font-mono text-[11px] text-faint">
                              {member.memberCode} · {member.phone}
                            </p>
                          </div>
                          <Check className="size-3.5 shrink-0 text-faint" strokeWidth={2} aria-hidden />
                        </button>
                      </li>
                    ))}
                    {filteredMembers.length === 0 && (
                      <li className="px-3 py-2 text-[11px] text-faint">No matching members.</li>
                    )}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* Current state hint */}
          {selectedMember && (
            <div className="mt-4">
              {openRecord ? (
                <p className="rounded-lg border border-gold/30 bg-gold/[0.08] px-3 py-2 text-[11px] text-gold-soft">
                  Currently checked in at {formatTime(openRecord.checkInAt)} for {date}.
                </p>
              ) : closedRecord ? (
                <p className="rounded-lg border border-line bg-card-hover/30 px-3 py-2 text-[11px] text-subtle">
                  Visited {formatTime(closedRecord.checkInAt)} – {formatTime(closedRecord.checkOutAt)} on{" "}
                  {date}.
                </p>
              ) : null}
            </div>
          )}

          {/* Membership warning */}
          {selectedMember && membershipWarn && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-[11px] text-warning">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
              <span>
                This member&apos;s membership is <strong>{membershipStatus}</strong>. You can still
                record the visit, but confirm their membership is up to date.
              </span>
            </div>
          )}

          {/* Date + time */}
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="att-date">Attendance date</Label>
              <Input
                id="att-date"
                type="date"
                className="mt-1.5"
                value={date}
                max={todayKey()}
                onChange={(event) => setDate(event.target.value)}
                aria-invalid={Boolean(errors.date)}
              />
              {errors.date && (
                <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.date}</p>
              )}
            </div>
            <div>
              <Label htmlFor="att-time">Attendance time</Label>
              <Input
                id="att-time"
                type="time"
                className="mt-1.5"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                aria-invalid={Boolean(errors.time)}
              />
              {errors.time && (
                <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.time}</p>
              )}
            </div>
          </div>

          {/* Action */}
          <div className="mt-5">
            <Label>Attendance action</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(["in", "out"] as AttendanceAction[]).map((value) => {
                const active = action === value;
                const Icon = value === "in" ? LogIn : LogOut;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setAction(value);
                      setErrors((current) => {
                        if (!current.action) return current;
                        const next = { ...current };
                        delete next.action;
                        return next;
                      });
                    }}
                    aria-pressed={active}
                    className={cn(
                      "flex h-10 items-center justify-center gap-2 rounded-lg text-[13px] font-medium transition-colors",
                      active
                        ? "gold-surface text-[#1A1503] shadow-gold"
                        : "border border-line bg-card text-subtle hover:bg-card-hover hover:text-ink",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={2} aria-hidden />
                    {value === "in" ? "Check In" : "Check Out"}
                  </button>
                );
              })}
            </div>
            {errors.action && (
              <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.action}</p>
            )}
          </div>

          {/* Notes */}
          <div className="mt-5">
            <Label htmlFor="att-notes">Notes (optional)</Label>
            <Input
              id="att-notes"
              className="mt-1.5"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="e.g. late arrival, guest pass"
            />
          </div>

          {/* Method */}
          <div className="mt-5 flex items-center justify-between rounded-xl border border-line bg-card-hover/20 px-4 py-3">
            <span className="text-xs text-faint">Marking method</span>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink">
              <Fingerprint className="size-3.5 text-faint" strokeWidth={1.75} aria-hidden />
              Manual
            </span>
          </div>

          {/* Historical confirmation */}
          {!isToday && date && !isFuture && (
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-[var(--color-gold)]"
                checked={historicalConfirmed}
                onChange={(event) => {
                  setHistoricalConfirmed(event.target.checked);
                  setErrors((current) => {
                    if (!current.historical) return current;
                    const next = { ...current };
                    delete next.historical;
                    return next;
                  });
                }}
              />
              <span className="text-[11px] text-warning">
                This is a historical entry for {date}. I confirm the date and time are correct.
              </span>
            </label>
          )}
          {errors.historical && (
            <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.historical}</p>
          )}
        </form>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line/60 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" size="md" disabled={submitting}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
            ) : action === "in" ? (
              <LogIn className="size-4" strokeWidth={2} aria-hidden />
            ) : (
              <LogOut className="size-4" strokeWidth={2} aria-hidden />
            )}
            {submitting ? "Saving…" : action === "in" ? "Check in" : "Check out"}
          </Button>
        </div>
      </aside>
    </>
  );
}
