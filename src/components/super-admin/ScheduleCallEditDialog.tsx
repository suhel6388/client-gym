"use client";

import {
  AlertCircle,
  CalendarClock,
  Loader2,
  Lock,
  Pencil,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/providers/ToastProvider";
import {
  ApiError,
  updateScheduleCall,
  type ScheduleCallDto,
} from "@/lib/api";
import {
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/lib/schedule-call-view";
import { cn } from "@/lib/cn";

const NOTE_LIMIT = 50;

type ScheduleCallEditDialogProps = {
  call: ScheduleCallDto;
  onClose: () => void;
  onUpdated: (call: ScheduleCallDto) => void;
};

type FieldErrors = Partial<Record<"clientName" | "callTime" | "note", string>>;

export function ScheduleCallEditDialog({
  call,
  onClose,
  onUpdated,
}: ScheduleCallEditDialogProps) {
  const toast = useToast();
  const [clientName, setClientName] = useState(call.clientName);
  const [callTime, setCallTime] = useState(toDateTimeLocalValue(call.callTime));
  const [note, setNote] = useState(call.note ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field: keyof FieldErrors) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    const trimmedName = clientName.trim();

    if (!trimmedName) next.clientName = "Enter the customer's name.";
    else if (trimmedName.length > 100) {
      next.clientName = "Name must be 100 characters or fewer.";
    }

    if (!callTime) next.callTime = "Choose the scheduled date and time.";
    else if (!fromDateTimeLocalValue(callTime)) {
      next.callTime = "Enter a valid date and time.";
    }

    if (note.length > NOTE_LIMIT) {
      next.note = `Note must be ${NOTE_LIMIT} characters or fewer.`;
    }

    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    const isoCallTime = fromDateTimeLocalValue(callTime);
    if (!isoCallTime) return;

    setSubmitting(true);
    try {
      const updated = await updateScheduleCall(call.id, {
        clientName: clientName.trim(),
        callTime: isoCallTime,
        note: note.trim() || null,
      });

      toast.success(
        "Enquiry updated",
        `${updated.clientName}'s scheduled call details were saved.`,
      );
      onUpdated(updated);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError("Couldn't save the enquiry. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !submitting) onClose();
      }}
    >
      <DialogContent className="max-w-[600px]">
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-line/60 bg-elevated px-5 pb-4 pt-5 sm:px-6">
          <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
            <Pencil className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-[17px] font-semibold text-ink">
              Edit enquiry #{call.id}
            </DialogTitle>
            <DialogDescription className="mt-1">
              Update the customer name, scheduled time or note.
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close edit enquiry"
              disabled={submitting}
              className="ml-auto inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-card hover:text-ink disabled:opacity-40"
            >
              <X className="size-4" strokeWidth={2} aria-hidden />
            </button>
          </DialogClose>
        </div>

        <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
          <div className="space-y-4 px-5 py-5 sm:px-6">
            <div>
              <Label htmlFor="edit-client-name">Customer name</Label>
              <Input
                id="edit-client-name"
                value={clientName}
                maxLength={100}
                autoComplete="name"
                onChange={(event) => {
                  setClientName(event.target.value);
                  clearError("clientName");
                }}
                aria-invalid={Boolean(errors.clientName)}
                aria-describedby={
                  errors.clientName ? "edit-client-name-error" : undefined
                }
                className={cn(
                  "mt-1.5",
                  errors.clientName && "border-danger/60 focus:border-danger",
                )}
              />
              {errors.clientName && (
                <p
                  id="edit-client-name-error"
                  role="alert"
                  className="mt-1.5 text-[11.5px] text-danger"
                >
                  {errors.clientName}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-call-time">Scheduled call time</Label>
              <div className="relative mt-1.5">
                <CalendarClock
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <Input
                  id="edit-call-time"
                  type="datetime-local"
                  value={callTime}
                  onChange={(event) => {
                    setCallTime(event.target.value);
                    clearError("callTime");
                  }}
                  aria-invalid={Boolean(errors.callTime)}
                  aria-describedby={
                    errors.callTime ? "edit-call-time-error" : undefined
                  }
                  className={cn(
                    "pl-9 [color-scheme:dark]",
                    errors.callTime && "border-danger/60 focus:border-danger",
                  )}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-faint">
                Shown in your local timezone and stored as UTC.
              </p>
              {errors.callTime && (
                <p
                  id="edit-call-time-error"
                  role="alert"
                  className="mt-1.5 text-[11.5px] text-danger"
                >
                  {errors.callTime}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="edit-note">Note</Label>
                <span
                  className={cn(
                    "text-[10.5px] tabular-nums",
                    note.length >= NOTE_LIMIT ? "text-gold" : "text-faint",
                  )}
                >
                  {note.length}/{NOTE_LIMIT}
                </span>
              </div>
              <Textarea
                id="edit-note"
                rows={3}
                maxLength={NOTE_LIMIT}
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  clearError("note");
                }}
                placeholder="Anything the team should know before the call?"
                aria-invalid={Boolean(errors.note)}
                aria-describedby={errors.note ? "edit-note-error" : undefined}
                className={cn(
                  "mt-1.5 min-h-[88px] resize-y",
                  errors.note && "border-danger/60 focus:border-danger",
                )}
              />
              {errors.note && (
                <p
                  id="edit-note-error"
                  role="alert"
                  className="mt-1.5 text-[11.5px] text-danger"
                >
                  {errors.note}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-line/70 bg-card/50 p-3.5">
              <div className="grid gap-3 text-[12px] sm:grid-cols-2">
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-faint">
                    Mobile number
                  </p>
                  <p className="mt-1 font-medium text-ink">{call.Mob}</p>
                </div>
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-faint">
                    IP address
                  </p>
                  <p className="mt-1 font-mono text-[11.5px] text-ink">
                    {call.ipAddress}
                  </p>
                </div>
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-4 text-faint">
                <Lock
                  className="mt-0.5 size-3 shrink-0 text-gold"
                  strokeWidth={1.9}
                  aria-hidden
                />
                Mobile and IP address are recorded automatically and cannot be
                edited.
              </p>
            </div>

            {formError && (
              <div
                role="alert"
                className="flex gap-2.5 rounded-xl border border-danger/30 bg-danger/8 px-3.5 py-3 text-danger"
              >
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0"
                  strokeWidth={1.9}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold">
                    Couldn&apos;t save the enquiry
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-5 opacity-90">
                    {formError}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-line/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            <Button
              variant="secondary"
              size="md"
              disabled={submitting}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2
                  className="size-4 animate-spin"
                  strokeWidth={2}
                  aria-hidden
                />
              ) : (
                <Pencil className="size-4" strokeWidth={2} aria-hidden />
              )}
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
