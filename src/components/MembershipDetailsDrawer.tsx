"use client";

import { Ban, CalendarDays, CreditCard, Repeat, Snowflake, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatLongDate } from "@/lib/format";
import { PAYMENT_MODE_OPTIONS } from "@/lib/member-form";
import { paiseToAmount, type PaymentDto } from "@/lib/members-api";
import { subscriptionTone, type SubscriptionRow } from "@/lib/membership-view";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

const modeLabels: Record<string, string> = Object.fromEntries(
  PAYMENT_MODE_OPTIONS.map((option) => [option.value, option.label]),
);

type MembershipDetailsDrawerProps = {
  row: SubscriptionRow | null;
  payments: PaymentDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRenew: (row: SubscriptionRow) => void;
  onFreeze: (row: SubscriptionRow) => void;
  onCancel: (row: SubscriptionRow) => void;
};

export function MembershipDetailsDrawer({
  row,
  payments,
  open,
  onOpenChange,
  onRenew,
  onFreeze,
  onCancel,
}: MembershipDetailsDrawerProps) {
  const canFreeze = row?.status === "Active" || row?.status === "Expiring";
  const canCancel = Boolean(row) && row?.status !== "Cancelled";

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
        aria-labelledby="membership-details-title"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line/60 px-6">
          <h2 id="membership-details-title" className="text-sm font-semibold text-ink">
            Subscription details
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

        {row && (
          <div className="scroll-thin flex-1 overflow-y-auto px-6 py-6">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <Avatar initials={row.memberInitials} className="size-14 text-base" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-ink">{row.memberName}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-xs text-faint">{row.memberCode}</span>
                  <Badge tone={subscriptionTone(row.status)} dot>
                    {row.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Membership summary */}
            <div className="mt-6 rounded-xl border border-gold/25 bg-gradient-to-b from-gold/[0.1] to-transparent p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                    Plan
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-ink">{row.planName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                    Fee
                  </p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-gold">
                    {formatCurrency(paiseToAmount(row.feePaise))}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line/50 pt-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-faint">Started</p>
                  <p className="mt-0.5 text-xs font-medium text-subtle">
                    {formatLongDate(row.startDate.slice(0, 10))}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-faint">Expires</p>
                  <p className="mt-0.5 text-xs font-medium text-subtle">
                    {formatLongDate(row.endDate.slice(0, 10))}
                  </p>
                </div>
              </div>
            </div>

            {/* Balance */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line bg-card-hover/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                  Collected
                </p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-success">
                  {formatCurrency(paiseToAmount(row.paidPaise))}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-card-hover/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                  Outstanding
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm font-semibold tabular-nums",
                    row.balancePaise > 0 ? "text-warning" : "text-subtle",
                  )}
                >
                  {formatCurrency(paiseToAmount(row.balancePaise))}
                </p>
              </div>
            </div>

            {/* Payment history */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">
                Payment history
              </h3>
              {payments.length === 0 ? (
                <p className="mt-2 rounded-lg border border-line/60 bg-card-hover/30 px-3.5 py-3 text-[13px] text-subtle">
                  No payments recorded for this member yet.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-line/40 rounded-xl border border-line/60">
                  {payments.map((payment) => (
                    <li key={payment.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold ring-1 ring-inset ring-gold/20">
                        <CreditCard className="size-3.5" strokeWidth={1.75} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">
                          {payment.receiptNumber}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-faint">
                          <CalendarDays className="size-3" strokeWidth={1.75} aria-hidden />
                          {formatLongDate(
                            String(payment.paymentDate ?? payment.paidAt).slice(0, 10),
                          )}
                          <span aria-hidden>·</span>
                          {modeLabels[payment.paymentMode] ?? payment.paymentMode}
                        </p>
                      </div>
                      <span className="shrink-0 text-[13px] font-semibold tabular-nums text-ink">
                        {formatCurrency(paiseToAmount(payment.amount))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="flex shrink-0 flex-col gap-2 border-t border-line/60 px-6 py-4 sm:flex-row sm:flex-wrap sm:justify-end">
          {canCancel && row && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              className="text-danger hover:bg-danger/10 hover:text-danger"
              disabled={!row}
              onClick={() => row && onCancel(row)}
            >
              <Ban className="size-4" strokeWidth={1.75} aria-hidden />
              Cancel
            </Button>
          )}
          {canFreeze && row && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={!row}
              onClick={() => row && onFreeze(row)}
            >
              <Snowflake className="size-4" strokeWidth={1.75} aria-hidden />
              Freeze
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!row}
            onClick={() => row && onRenew(row)}
          >
            <Repeat className="size-4" strokeWidth={2} aria-hidden />
            Renew
          </Button>
        </div>
      </aside>
    </>
  );
}
