"use client";

import {
  CalendarClock,
  Clock3,
  Globe2,
  History,
  Pencil,
  StickyNote,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ScheduleCallDto } from "@/lib/api";
import {
  formatCallDistance,
  formatScheduleCallDate,
  formatScheduleCallDateTime,
  scheduleCallStatus,
} from "@/lib/schedule-call-view";
import { ScheduleCallStatusBadge } from "./ScheduleCallStatusBadge";

type ScheduleCallViewDialogProps = {
  call: ScheduleCallDto;
  onClose: () => void;
  onEdit: (call: ScheduleCallDto) => void;
  onDelete: (call: ScheduleCallDto) => void;
  onWhatsApp: (call: ScheduleCallDto) => void;
};

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarClock;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 gap-2.5">
      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold ring-1 ring-inset ring-gold/20">
        <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-faint">
          {label}
        </p>
        <div className="mt-0.5 break-words text-[13px] leading-relaxed text-ink">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ScheduleCallViewDialog({
  call,
  onClose,
  onEdit,
  onDelete,
  onWhatsApp,
}: ScheduleCallViewDialogProps) {
  const status = scheduleCallStatus(call);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[620px]">
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-line/60 bg-elevated px-5 pb-4 pt-5 sm:px-6">
          <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
            <CalendarClock className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="text-[17px] font-semibold text-ink">
                Enquiry #{call.id}
              </DialogTitle>
              <ScheduleCallStatusBadge status={status} />
            </div>
            <DialogDescription className="mt-1">
              Capture details of this scheduled call request.
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close enquiry details"
              className="ml-auto inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-card hover:text-ink"
            >
              <X className="size-4" strokeWidth={2} aria-hidden />
            </button>
          </DialogClose>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Detail icon={UserRound} label="Customer">
              {call.clientName}
            </Detail>
            <Detail icon={Clock3} label="Mobile number">
              <a
                href={`tel:${call.Mob.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-1.5 text-gold hover:text-gold-bright"
              >
                {call.Mob}
              </a>
            </Detail>
            <Detail icon={CalendarClock} label="Scheduled call">
              <span className="text-ink">
                {formatScheduleCallDateTime(call.callTime)}
              </span>
              <span className="ml-1.5 text-[11px] text-faint">
                {formatCallDistance(call.callTime)}
              </span>
            </Detail>
            <Detail icon={Globe2} label="IP address">
              <span className="font-mono text-[12px]">{call.ipAddress}</span>
            </Detail>
          </div>

          <div className="rounded-xl border border-line/70 bg-card/50 p-3.5">
            <div className="flex items-start gap-2.5">
              <StickyNote
                className="mt-0.5 size-3.5 shrink-0 text-gold"
                strokeWidth={1.75}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-faint">
                  Notes
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-subtle">
                  {call.note?.trim() || "No note was submitted."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line/60 pt-3 text-[11px] text-faint">
            <span className="inline-flex items-center gap-1.5">
              <History className="size-3.5" strokeWidth={1.75} aria-hidden />
              Created {formatScheduleCallDate(call.createdAt)}
            </span>
            {call.updatedAt && (
              <span>Updated {formatScheduleCallDate(call.updatedAt)}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-line/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            type="button"
            onClick={() => onDelete(call)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3.5 text-[12.5px] font-medium text-danger transition-colors hover:bg-danger/15"
          >
            <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
            Delete
          </button>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => onEdit(call)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line bg-card px-3.5 text-[12.5px] font-medium text-ink transition-colors hover:border-line-strong hover:bg-card-hover"
            >
              <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
              Edit
            </button>
            <button
              type="button"
              onClick={() => onWhatsApp(call)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#25D366]/35 bg-[#25D366]/12 px-3.5 text-[12.5px] font-semibold text-[#25D366] transition-colors hover:bg-[#25D366]/18"
            >
              <FaWhatsapp className="size-4" aria-hidden />
              WhatsApp
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
