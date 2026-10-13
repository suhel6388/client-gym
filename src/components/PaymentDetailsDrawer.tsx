"use client";

import {
  CalendarDays,
  Copy,
  CreditCard,
  Hash,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatLongDate } from "@/lib/format";
import { paiseToAmount } from "@/lib/members-api";
import {
  formatTime,
  paymentModeTone,
  paymentStatusLabel,
  paymentStatusTone,
  type PaymentRow,
} from "@/lib/payments-view";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

type PaymentDetailsDrawerProps = {
  row: PaymentRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopyReceipt: (row: PaymentRow) => void;
  onViewMember: (row: PaymentRow) => void;
};

export function PaymentDetailsDrawer({
  row,
  open,
  onOpenChange,
  onCopyReceipt,
  onViewMember,
}: PaymentDetailsDrawerProps) {
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
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-card shadow-pop transition-transform duration-300 sm:max-w-md",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-details-title"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line/60 px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <Wallet className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <h2 id="payment-details-title" className="text-sm font-semibold text-ink">
              Payment receipt
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="inline-flex size-8 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-card-hover hover:text-ink"
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        {row && (
          <div className="scroll-thin flex-1 overflow-y-auto px-6 py-6">
            {/* Amount hero */}
            <div className="rounded-xl border border-gold/25 bg-gradient-to-b from-gold/[0.1] to-transparent p-5 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                Amount received
              </p>
              <p className="mt-2 text-[34px] leading-none font-bold tracking-tight text-gold tabular-nums">
                {formatCurrency(paiseToAmount(row.amountPaise))}
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Badge tone={paymentStatusTone(row.status)} dot>
                  {paymentStatusLabel(row.status)}
                </Badge>
                <Badge tone={paymentModeTone(row.paymentMode)}>{row.modeLabel}</Badge>
              </div>
            </div>

            {/* Member */}
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-card-hover/20 p-4">
              <Avatar initials={row.memberInitials} className="size-11" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{row.memberName}</p>
                <p className="truncate font-mono text-[11px] text-faint">{row.memberCode}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewMember(row)}
                aria-label={`View ${row.memberName}`}
              >
                <UserRound className="size-3.5" strokeWidth={1.75} aria-hidden />
                Profile
              </Button>
            </div>

            {/* Receipt fields */}
            <dl className="mt-5 divide-y divide-line/40 rounded-xl border border-line/60">
              <Field
                icon={Hash}
                label="Receipt number"
                value={
                  <span className="font-mono text-gold-soft">{row.receiptNumber}</span>
                }
              />
              <Field
                icon={CalendarDays}
                label="Payment date"
                value={`${formatLongDate(row.dateKey)} · ${formatTime(row.paymentDate)}`}
              />
              <Field icon={CreditCard} label="Payment method" value={row.modeLabel} />
              <Field
                icon={Hash}
                label="Transaction ID"
                value={<span className="font-mono text-[11px] text-subtle">{row.id}</span>}
              />
              <Field
                icon={Wallet}
                label="Reference"
                value={
                  row.reference ? (
                    <span className="font-mono text-[11px] text-subtle">{row.reference}</span>
                  ) : (
                    "—"
                  )
                }
              />
            </dl>

            <p className="mt-4 text-[11px] leading-relaxed text-faint">
              This receipt is generated from the stored payment record. Receipt numbers are issued
              by the server and are unique per gym.
            </p>
          </div>
        )}

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line/60 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={!row}
            onClick={() => row && onViewMember(row)}
          >
            <UserRound className="size-4" strokeWidth={1.75} aria-hidden />
            View member
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!row}
            onClick={() => row && onCopyReceipt(row)}
          >
            <Copy className="size-4" strokeWidth={2} aria-hidden />
            Copy receipt no.
          </Button>
        </div>
      </aside>
    </>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hash;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-card-hover text-faint">
        <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
          {label}
        </dt>
        <dd className="mt-0.5 text-[13px] text-ink">{value}</dd>
      </div>
    </div>
  );
}
