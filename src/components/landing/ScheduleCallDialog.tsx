"use client";

import {
  AlertCircle,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  Clock3,
  Loader2,
  Lock,
  X,
} from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { ApiError, createScheduleCall } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  buildScheduleDateOptions,
  buildScheduleTimeSlots,
  formatCallDateTime,
  isValidMobile,
  normalizeMobile,
  type ScheduleDateOption,
} from "@/lib/schedule-call";
import { useToast } from "../providers/ToastProvider";
import { Button } from "../ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";

const CTA_CLASSES =
  "group inline-flex h-[52px] w-full items-center justify-center gap-6 rounded-xl border border-lp-gold/35 bg-black/10 px-6 text-[13.5px] font-semibold text-lp-ink transition-all duration-300 hover:border-lp-gold/65 hover:bg-lp-gold/[0.065] hover:text-lp-gold-highlight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-gold-highlight sm:w-auto";

const FIELD_CLASSES =
  "h-10 rounded-xl border-[#2B2B2B] bg-[#101010] text-[13px] text-white placeholder:text-[#6B6B70] focus:border-[#D4AF37] focus:ring-2 focus:ring-[rgba(212,175,55,0.18)]";

const TEXTAREA_CLASSES =
  "min-h-[76px] resize-none rounded-xl border-[#2B2B2B] bg-[#101010] text-[13px] text-white placeholder:text-[#6B6B70] focus:border-[#D4AF37] focus:ring-2 focus:ring-[rgba(212,175,55,0.18)]";

const PRIMARY_BUTTON_CLASSES =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#E8C55B_0%,#D4AF37_55%,#B8912B_100%)] px-5 text-[13px] font-bold text-[#171203] shadow-[0_10px_28px_-12px_rgba(212,175,55,0.8)] transition-all duration-200 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100";

type FieldErrors = Partial<
  Record<"clientName" | "mob" | "callTime" | "note", string>
>;

type ScheduleCallFormProps = {
  onScheduled: () => void;
};

function readNextAllowedAt(error: ApiError): Date | null {
  const payload = error.payload;
  if (!payload || typeof payload !== "object") return null;

  const value = (payload as { nextAllowedAt?: unknown }).nextAllowedAt;
  if (typeof value !== "string") return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[11.5px] text-[#FCA5A5]">
      {message}
    </p>
  );
}

/**
 * Trigger button for the hero's secondary CTA plus the schedule-call modal.
 * The content is unmounted by Radix on close, so every opening starts with a
 * fresh form and freshly generated dates/slots.
 */
export function ScheduleCallLauncher({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={CTA_CLASSES}>
          {label}
          <CalendarDays
            aria-hidden
            className="size-4 text-lp-gold transition-transform duration-300 group-hover:scale-105"
            strokeWidth={1.9}
          />
        </button>
      </DialogTrigger>

      <DialogContent
        ref={contentRef}
        onOpenAutoFocus={(event) => {
          // Start in the first required field rather than the close button.
          // `currentTarget` is cleared once React finishes dispatching, so read
          // the content node from the ref instead.
          event.preventDefault();
          window.requestAnimationFrame(() => {
            contentRef.current
              ?.querySelector<HTMLInputElement>("#schedule-client-name")
              ?.focus();
          });
        }}
      >
        <ScheduleCallForm onScheduled={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ScheduleCallForm({ onScheduled }: ScheduleCallFormProps) {
  const toast = useToast();

  // Generated once per mount; the modal remounts every time it is opened.
  const dateOptions = useMemo(() => buildScheduleDateOptions(), []);
  const [selectedDateKey, setSelectedDateKey] = useState(
    () => dateOptions[0]?.key ?? "",
  );

  const selectedDate =
    dateOptions.find((option) => option.key === selectedDateKey) ??
    dateOptions[0];

  const timeSlots = useMemo(
    () =>
      selectedDate ? buildScheduleTimeSlots(selectedDate.date) : [],
    [selectedDate],
  );

  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(
    () => timeSlots.find((slot) => !slot.disabled)?.minutes ?? null,
  );

  const selectedSlot =
    timeSlots.find(
      (slot) => slot.minutes === selectedMinutes && !slot.disabled,
    ) ?? null;

  const [clientName, setClientName] = useState("");
  const [mob, setMob] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field: keyof FieldErrors) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSelectDate = (option: ScheduleDateOption) => {
    setSelectedDateKey(option.key);
    const nextSlots = buildScheduleTimeSlots(option.date);
    setSelectedMinutes(
      nextSlots.find((slot) => !slot.disabled)?.minutes ?? null,
    );
    clearError("callTime");
    setFormError(null);
    setRateLimited(false);
  };

  const handleSelectTime = (minutes: number) => {
    setSelectedMinutes(minutes);
    clearError("callTime");
    setFormError(null);
    setRateLimited(false);
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    const trimmedName = clientName.trim();

    if (!trimmedName) next.clientName = "Please enter your name.";
    else if (trimmedName.length > 40) {
      next.clientName = "Name must be 40 characters or fewer.";
    }

    if (!mob.trim()) next.mob = "Please enter your mobile number.";
    else if (!isValidMobile(mob)) {
      next.mob = "Enter a valid mobile number (10–13 digits, optional +).";
    }

    if (!selectedSlot) {
      next.callTime = "Choose an available date and time.";
    } else if (selectedSlot.date.getTime() <= Date.now()) {
      next.callTime = "That time has passed. Choose a later slot.";
    }

    if (note.length > 50) {
      next.note = "Note must be 50 characters or fewer.";
    }

    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    setFormError(null);
    setRateLimited(false);
    if (Object.keys(nextErrors).length > 0 || !selectedSlot) return;

    setSubmitting(true);
    try {
      await createScheduleCall({
        clientName: clientName.trim(),
        mob: normalizeMobile(mob),
        // ISO 8601 in UTC; the visitor picked the same instant in local time.
        callTime: selectedSlot.date.toISOString(),
        note: note.trim() || null,
      });

      // The backend has confirmed creation, so it is now safe to close and
      // claim the call was scheduled.
      toast.success(
        "Call scheduled",
        `We'll call you on ${formatCallDateTime(selectedSlot.date)}.`,
      );
      onScheduled();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 429) {
          const nextAllowedAt = readNextAllowedAt(error);
          const base =
            error.message?.trim() ||
            "Only one call can be scheduled per IP every 24 hours.";
          setRateLimited(true);
          setFormError(
            nextAllowedAt
              ? `${base} You can request another call after ${formatCallDateTime(nextAllowedAt)}.`
              : `${base} Please try again after 24 hours.`,
          );
        } else if (error.status === 0) {
          setFormError(
            "We couldn't reach the server. Check your connection and try again.",
          );
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-[#2B2B2B] bg-[#151515] px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
        <div className="flex items-start gap-3.5 pr-10">
          <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(212,175,55,0.28)] bg-[rgba(212,175,55,0.09)] text-[#D4AF37] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <CalendarClock className="size-5" strokeWidth={1.7} aria-hidden />
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-[19px] font-semibold tracking-[-0.01em] text-white sm:text-xl">
              Schedule a Call
            </DialogTitle>
            <DialogDescription className="mt-1 text-[12.5px] leading-5 text-[#A1A1AA] sm:text-[13px]">
              Book a quick 30-minute walkthrough with our team.
            </DialogDescription>
          </div>
        </div>

        <DialogClose asChild>
          <button
            type="button"
            aria-label="Close schedule a call dialog"
            className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-lg border border-transparent text-[#A1A1AA] transition-colors hover:border-[#2B2B2B] hover:bg-[#1D1D1D] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
          >
            <X className="size-4" strokeWidth={2} aria-hidden />
          </button>
        </DialogClose>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={submitting}
        className="px-5 pb-5 pt-5 sm:px-7 sm:pb-6 sm:pt-6"
      >
        {/* Date selection */}
        <section aria-labelledby="schedule-date-heading">
          <div className="flex items-center justify-between gap-3">
            <h3
              id="schedule-date-heading"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A1A1AA]"
            >
              Select a date
            </h3>
            <span className="text-[11px] font-medium text-[#71717A]">
              Next {dateOptions.length} days
            </span>
          </div>

          <div
            role="group"
            aria-labelledby="schedule-date-heading"
            className="mt-2.5 grid grid-cols-4 gap-2 sm:grid-cols-6"
          >
            {dateOptions.map((option) => {
              const selected = option.key === selectedDateKey;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleSelectDate(option)}
                  aria-pressed={selected}
                  aria-label={option.fullLabel}
                  className={cn(
                    "flex min-h-[58px] flex-col items-center justify-center rounded-xl border px-1 py-2 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]",
                    selected
                      ? "border-[#D4AF37] bg-[linear-gradient(135deg,#E8C55B_0%,#D4AF37_100%)] text-[#171203] shadow-[0_10px_26px_-12px_rgba(212,175,55,0.8)]"
                      : "border-[#2B2B2B] bg-[#101010] text-[#A1A1AA] hover:border-[rgba(212,175,55,0.45)] hover:bg-[rgba(212,175,55,0.07)] hover:text-white",
                  )}
                >
                  <span
                    className={cn(
                      "text-[9.5px] font-bold uppercase tracking-[0.14em]",
                      selected ? "text-[#574207]" : "text-[#71717A]",
                    )}
                  >
                    {option.weekday}
                  </span>
                  <span className="mt-0.5 text-[12.5px] font-semibold">
                    {option.dayMonth}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Time selection */}
        <section aria-labelledby="schedule-time-heading" className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <h3
              id="schedule-time-heading"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A1A1AA]"
            >
              Select a time
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#2B2B2B] px-2 py-0.5 text-[10px] font-medium text-[#71717A]">
              <Clock3 className="size-3" strokeWidth={1.8} aria-hidden />
              30 min
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#71717A]">
            Times are shown in your local time.
          </p>

          <div
            role="group"
            aria-labelledby="schedule-time-heading"
            aria-describedby={
              errors.callTime ? "schedule-call-time-error" : undefined
            }
            className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4"
          >
            {timeSlots.map((slot) => {
              const selected =
                slot.minutes === selectedMinutes && !slot.disabled;
              return (
                <button
                  key={slot.minutes}
                  type="button"
                  disabled={slot.disabled}
                  onClick={() => handleSelectTime(slot.minutes)}
                  aria-pressed={selected}
                  aria-label={
                    slot.disabled
                      ? `${slot.label} is no longer available`
                      : slot.label
                  }
                  className={cn(
                    "h-9 rounded-lg border text-[12px] font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]",
                    selected
                      ? "border-[#D4AF37] bg-[#D4AF37] text-[#171203] shadow-[0_8px_20px_-10px_rgba(212,175,55,0.8)]"
                      : "border-[#2B2B2B] bg-[#101010] text-[#D4D4D8] hover:border-[rgba(212,175,55,0.45)] hover:bg-[rgba(212,175,55,0.07)] hover:text-white",
                    slot.disabled &&
                      "cursor-not-allowed border-[#232323] bg-[#0D0D0D] text-[#52525B] line-through hover:border-[#232323] hover:bg-[#0D0D0D] hover:text-[#52525B]",
                  )}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>

          {timeSlots.every((slot) => slot.disabled) && (
            <p className="mt-2 text-[11.5px] text-[#A1A1AA]">
              No times are left for this date. Choose another day.
            </p>
          )}

          <FieldError
            id="schedule-call-time-error"
            message={errors.callTime}
          />
        </section>

        {/* Visitor details */}
        <section
          aria-labelledby="schedule-details-heading"
          className="mt-6 border-t border-[#2B2B2B] pt-5"
        >
          <h3
            id="schedule-details-heading"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A1A1AA]"
          >
            Your details
          </h3>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <Label
                htmlFor="schedule-client-name"
                className="mb-1.5 block text-[12px] font-medium text-[#A1A1AA]"
              >
                Full name
                <span aria-hidden className="ml-0.5 text-[#D4AF37]">
                  *
                </span>
              </Label>
              <Input
                id="schedule-client-name"
                name="clientName"
                type="text"
                autoComplete="name"
                required
                maxLength={40}
                placeholder="Rahul Sharma"
                value={clientName}
                onChange={(event) => {
                  setClientName(event.target.value);
                  clearError("clientName");
                }}
                aria-invalid={Boolean(errors.clientName)}
                aria-describedby={
                  errors.clientName ? "schedule-client-name-error" : undefined
                }
                className={cn(
                  FIELD_CLASSES,
                  errors.clientName &&
                    "border-[rgba(248,113,113,0.65)] focus:border-[#F87171] focus:ring-[rgba(248,113,113,0.16)]",
                )}
              />
              <FieldError
                id="schedule-client-name-error"
                message={errors.clientName}
              />
            </div>

            <div className="min-w-0">
              <Label
                htmlFor="schedule-mobile"
                className="mb-1.5 block text-[12px] font-medium text-[#A1A1AA]"
              >
                Mobile number
                <span aria-hidden className="ml-0.5 text-[#D4AF37]">
                  *
                </span>
              </Label>
              <Input
                id="schedule-mobile"
                name="mob"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                maxLength={16}
                placeholder="+91 98765 43210"
                value={mob}
                onChange={(event) => {
                  const next = event.target.value.replace(/[^\d+\s()-]/g, "");
                  setMob(next);
                  clearError("mob");
                }}
                aria-invalid={Boolean(errors.mob)}
                aria-describedby={
                  errors.mob ? "schedule-mobile-error" : "schedule-mobile-hint"
                }
                className={cn(
                  FIELD_CLASSES,
                  errors.mob &&
                    "border-[rgba(248,113,113,0.65)] focus:border-[#F87171] focus:ring-[rgba(248,113,113,0.16)]",
                )}
              />
              <p
                id="schedule-mobile-hint"
                className={cn(
                  "mt-1.5 text-[10.5px] text-[#71717A]",
                  errors.mob && "sr-only",
                )}
              >
                Include the country code if you use a `+` prefix.
              </p>
              <FieldError id="schedule-mobile-error" message={errors.mob} />
            </div>
          </div>

          {/* callTime is selected above and sent as ISO 8601; this read-only
              row makes the exact choice visible before submission. */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-[12px] font-medium text-[#A1A1AA]">
                Call time
                <span aria-hidden className="ml-0.5 text-[#D4AF37]">
                  *
                </span>
              </span>
              <span className="text-[10.5px] text-[#71717A]">
                {selectedSlot ? "Selected" : "Choose above"}
              </span>
            </div>
            <div
              aria-live="polite"
              className={cn(
                "flex min-h-10 items-center gap-2.5 rounded-xl border border-[#2B2B2B] bg-[#101010] px-3 py-2",
                errors.callTime && "border-[rgba(248,113,113,0.65)]",
              )}
            >
              <CalendarCheck2
                className={cn(
                  "size-4 shrink-0",
                  selectedSlot ? "text-[#D4AF37]" : "text-[#71717A]",
                )}
                strokeWidth={1.8}
                aria-hidden
              />
              <span
                className={cn(
                  "text-[12.5px] font-medium",
                  selectedSlot ? "text-white" : "text-[#71717A]",
                )}
              >
                {selectedSlot
                  ? formatCallDateTime(selectedSlot.date)
                  : "Select an available date and time"}
              </span>
              <span className="ml-auto hidden shrink-0 rounded-full border border-[rgba(212,175,55,0.22)] bg-[rgba(212,175,55,0.07)] px-2 py-0.5 text-[10px] font-medium text-[#D4AF37] sm:inline">
                30 min
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <Label
                htmlFor="schedule-note"
                className="text-[12px] font-medium text-[#A1A1AA]"
              >
                Note{" "}
                <span className="font-normal text-[#71717A]">(optional)</span>
              </Label>
              <span
                aria-live="polite"
                className={cn(
                  "text-[10.5px] tabular-nums",
                  note.length >= 50 ? "text-[#D4AF37]" : "text-[#71717A]",
                )}
              >
                {note.length}/50
              </span>
            </div>
            <Textarea
              id="schedule-note"
              name="note"
              rows={2}
              maxLength={50}
              placeholder="Anything we should know before the call?"
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                clearError("note");
              }}
              aria-invalid={Boolean(errors.note)}
              aria-describedby={
                errors.note ? "schedule-note-error" : "schedule-note-count"
              }
              className={cn(
                TEXTAREA_CLASSES,
                errors.note &&
                  "border-[rgba(248,113,113,0.65)] focus:border-[#F87171] focus:ring-[rgba(248,113,113,0.16)]",
              )}
            />
            <span id="schedule-note-count" className="sr-only">
              Maximum 50 characters. {note.length} used.
            </span>
            <FieldError id="schedule-note-error" message={errors.note} />
          </div>

          <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-4 text-[#71717A]">
            <Lock
              className="mt-0.5 size-3 shrink-0 text-[#D4AF37]"
              strokeWidth={1.9}
              aria-hidden
            />
            Your IP address is recorded automatically by the server for
            security. You never need to enter it.
          </p>
        </section>

        {formError && (
          <div
            role="alert"
            className={cn(
              "mt-4 flex gap-2.5 rounded-xl border px-3.5 py-3",
              rateLimited
                ? "border-[rgba(212,175,55,0.35)] bg-[rgba(212,175,55,0.09)] text-[#F3D98B]"
                : "border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.08)] text-[#FCA5A5]",
            )}
          >
            {rateLimited ? (
              <Clock3
                className="mt-0.5 size-4 shrink-0 text-[#D4AF37]"
                strokeWidth={1.9}
                aria-hidden
              />
            ) : (
              <AlertCircle
                className="mt-0.5 size-4 shrink-0"
                strokeWidth={1.9}
                aria-hidden
              />
            )}
            <div className="min-w-0">
              <p className="text-[12px] font-semibold">
                {rateLimited
                  ? "Call already scheduled"
                  : "Couldn't schedule your call"}
              </p>
              <p className="mt-0.5 text-[11.5px] leading-5 opacity-90">
                {formError}
              </p>
            </div>
          </div>
        )}

        <div className="sticky bottom-0 z-10 -mx-5 mt-5 flex flex-col-reverse gap-2 border-t border-[#2B2B2B] bg-[#151515] px-5 pb-4 pt-4 sm:-mx-7 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-[10.5px] leading-4 text-[#71717A]">
            Our team will confirm your slot after the request is received.
          </p>
          <div className="flex items-center gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={submitting}
                className="h-10 rounded-xl border-[#2B2B2B] bg-[#101010] px-4 text-[12.5px] text-[#D4D4D8] hover:border-[#3A3A3A] hover:bg-[#1A1A1A] hover:text-white"
              >
                Cancel
              </Button>
            </DialogClose>
            <button
              type="submit"
              disabled={submitting}
              className={PRIMARY_BUTTON_CLASSES}
            >
              {submitting ? (
                <Loader2
                  className="size-4 animate-spin"
                  strokeWidth={2.2}
                  aria-hidden
                />
              ) : (
                <CalendarCheck2
                  className="size-4"
                  strokeWidth={2}
                  aria-hidden
                />
              )}
              {submitting ? "Scheduling…" : "Schedule call"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
