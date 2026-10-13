"use client";

import {
  Archive,
  CalendarDays,
  CreditCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatLongDate } from "@/lib/format";
import { getInitials, paiseToAmount, toMemberRow, type MemberDto } from "@/lib/members-api";
import { statusTone } from "@/lib/member-ui";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

type MemberDetailsDrawerProps = {
  member: MemberDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (member: MemberDto) => void;
  onArchive: (member: MemberDto) => void;
};

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold ring-1 ring-inset ring-gold/20">
        <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-faint">
          {label}
        </p>
        <div className="mt-0.5 text-[13px] font-medium text-ink">{children}</div>
      </div>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <span className="text-subtle">{children}</span>;
}

export function MemberDetailsDrawer({
  member,
  open,
  onOpenChange,
  onEdit,
  onArchive,
}: MemberDetailsDrawerProps) {
  const row = member ? toMemberRow(member) : null;
  const membership = row?.membership ?? null;
  const feePaise = membership
    ? Math.max(0, membership.pricePaise - membership.discountPaise)
    : 0;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-card shadow-pop transition-transform duration-300 sm:max-w-lg",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-details-title"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line/60 px-6">
          <h2 id="member-details-title" className="text-sm font-semibold text-ink">
            Member details
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="inline-flex size-8 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-card-hover hover:text-ink"
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        {member && row && (
          <div className="scroll-thin flex-1 overflow-y-auto px-6 py-6">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <Avatar initials={getInitials(member.name)} className="size-14 text-base" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-ink">{member.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-xs text-faint">{member.memberCode}</span>
                  <Badge tone={statusTone(row.status)} dot>
                    {row.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Membership summary */}
            <div className="mt-6 rounded-xl border border-gold/25 bg-gradient-to-b from-gold/[0.1] to-transparent p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                    Current plan
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {membership?.plan?.name ?? "No active plan"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                    Paid
                  </p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-gold">
                    {formatCurrency(paiseToAmount(feePaise))}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line/50 pt-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-faint">Started</p>
                  <p className="mt-0.5 text-xs font-medium text-subtle">
                    {membership ? formatLongDate(membership.startDate.slice(0, 10)) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-faint">Expires</p>
                  <p className="mt-0.5 text-xs font-medium text-subtle">
                    {membership ? formatLongDate(membership.endDate.slice(0, 10)) : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Personal */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">
                Personal information
              </h3>
              <div className="mt-2 divide-y divide-line/40">
                <DetailRow icon={Mail} label="Email">
                  {member.email || <Empty>Not provided</Empty>}
                </DetailRow>
                <DetailRow icon={Phone} label="Phone">
                  {member.phone}
                </DetailRow>
                <DetailRow icon={CalendarDays} label="Date of birth">
                  {member.dateOfBirth ? (
                    formatLongDate(member.dateOfBirth.slice(0, 10))
                  ) : (
                    <Empty>Not provided</Empty>
                  )}
                </DetailRow>
                <DetailRow icon={MapPin} label="Address">
                  {member.address || <Empty>Not provided</Empty>}
                </DetailRow>
                <DetailRow icon={ShieldAlert} label="Emergency contact">
                  {member.emergencyContact || member.emergencyPhone ? (
                    <span>
                      {member.emergencyContact || "—"}
                      {member.emergencyPhone && (
                        <span className="ml-1.5 text-subtle">· {member.emergencyPhone}</span>
                      )}
                    </span>
                  ) : (
                    <Empty>Not provided</Empty>
                  )}
                </DetailRow>
                <DetailRow icon={CreditCard} label="Gender & timing">
                  <span className="capitalize">{member.gender || "—"}</span>
                  <span className="ml-2 text-subtle">· {member.timing.toLowerCase()}</span>
                </DetailRow>
              </div>
            </div>

            {member.notes && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">
                  Notes
                </h3>
                <p className="mt-2 rounded-lg border border-line/60 bg-card-hover/40 px-3.5 py-3 text-[13px] leading-relaxed text-subtle">
                  {member.notes}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex shrink-0 gap-2 border-t border-line/60 px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="flex-1 sm:flex-none"
            disabled={!member}
            onClick={() => member && onArchive(member)}
          >
            <Archive className="size-4" strokeWidth={1.75} aria-hidden />
            Archive
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            className="flex-1 sm:flex-none"
            disabled={!member}
            onClick={() => member && onEdit(member)}
          >
            <Pencil className="size-4" strokeWidth={2} aria-hidden />
            Edit member
          </Button>
        </div>
      </aside>
    </>
  );
}
