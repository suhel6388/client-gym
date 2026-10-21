"use client";

import { Loader2, Wallet, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { PAYMENT_MODE_OPTIONS, todayIso } from "@/lib/member-form";
import {
  amountToPaise,
  createPayment,
  paiseToAmount,
  type PaymentModeDto,
} from "@/lib/members-api";
import type { SubscriptionRow } from "@/lib/membership-view";
import { useToast } from "./providers/ToastProvider";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";

const FORM_ID = "record-payment-form";

/**
 * Defaults the payment date inside the membership window so the existing
 * date-window payment attribution correctly counts the payment against it.
 */
function defaultPaymentDate(row: SubscriptionRow | null): string {
  if (!row) return todayIso();
  const today = todayIso();
  const start = row.startDate.slice(0, 10);
  const end = row.endDate.slice(0, 10);
  if (today < start) return start;
  if (today > end) return end;
  return today;
}

type RecordPaymentDrawerProps = {
  open: boolean;
  row: SubscriptionRow | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

export function RecordPaymentDrawer({
  open,
  row,
  onOpenChange,
  onSaved,
}: RecordPaymentDrawerProps) {
  const toast = useToast();

  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentModeDto>("CASH");
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [reference, setReference] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !row) return;
    setAmount(row.balancePaise > 0 ? String(paiseToAmount(row.balancePaise)) : "");
    setPaymentMode("CASH");
    setPaymentDate(defaultPaymentDate(row));
    setReference("");
    setErrors({});
    setServerError(null);
    setSubmitting(false);
  }, [open, row]);

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

  const amountPaise = amount.trim() === "" ? 0 : amountToPaise(Number(amount) || 0);
  const balanceAfter = row ? Math.max(0, row.balancePaise - amountPaise) : 0;
  const overpaying = row ? amountPaise > row.balancePaise : false;

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!row) return;

      const found: Record<string, string> = {};
      const value = Number(amount);
      if (amount.trim() === "" || Number.isNaN(value) || value <= 0) {
        found.amount = "Enter an amount greater than zero.";
      }
      if (!paymentDate) found.paymentDate = "Payment date is required.";
      setErrors(found);
      if (Object.keys(found).length > 0) return;

      setServerError(null);
      setSubmitting(true);
      try {
        await toast.promise(
          createPayment({
            memberId: row.memberId,
            amount: amountToPaise(value),
            paymentMode,
            reference: reference.trim() || null,
            paymentDate,
            status: "SUCCESS",
          }),
          {
            loading: {
              title: "Recording payment…",
              description: "Saving the receipt on the server.",
            },
            success: {
              title: "Payment recorded",
              description: `${formatCurrency(value)} received from ${row.memberName}.`,
            },
            error: (caught) => ({
              title: "Couldn't record payment",
              description:
                caught instanceof ApiError ? caught.message : "Please try again.",
            }),
          },
        );
        onSaved?.();
        onOpenChange(false);
      } catch (caught) {
        setServerError(
          caught instanceof ApiError ? caught.message : "Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [amount, onOpenChange, onSaved, paymentDate, paymentMode, reference, row, toast],
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
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-card shadow-pop transition-transform duration-300 sm:max-w-md",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-payment-title"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line/60 px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <Wallet className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <h2 id="record-payment-title" className="text-sm font-semibold text-ink">
              Record payment
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

          {row && (
            <div className="rounded-xl border border-gold/25 bg-gradient-to-b from-gold/[0.08] to-transparent p-4">
              <p className="text-sm font-semibold text-ink">{row.memberName}</p>
              <p className="mt-0.5 font-mono text-[11px] text-faint">
                {row.memberCode} · {row.planName}
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-line/50 pt-3 text-center">
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-faint">Fee</dt>
                  <dd className="mt-0.5 text-[13px] font-semibold tabular-nums text-ink">
                    {formatCurrency(paiseToAmount(row.feePaise))}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-faint">Paid</dt>
                  <dd className="mt-0.5 text-[13px] font-semibold tabular-nums text-success">
                    {formatCurrency(paiseToAmount(row.paidPaise))}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-faint">Balance</dt>
                  <dd
                    className={cn(
                      "mt-0.5 text-[13px] font-semibold tabular-nums",
                      row.balancePaise > 0 ? "text-warning" : "text-subtle",
                    )}
                  >
                    {formatCurrency(paiseToAmount(row.balancePaise))}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <div className="mt-6 space-y-5">
            <div>
              <Label htmlFor="pay-amount">Amount</Label>
              <Input
                id="pay-amount"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                className="mt-1.5"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-invalid={Boolean(errors.amount)}
                autoFocus
              />
              {errors.amount ? (
                <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.amount}</p>
              ) : overpaying ? (
                <p className="mt-1.5 text-[11px] text-warning">
                  Amount exceeds the outstanding balance — the extra is recorded as advance.
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="pay-mode">Payment method</Label>
                <Select
                  id="pay-mode"
                  className="mt-1.5"
                  value={paymentMode}
                  onChange={(event) => setPaymentMode(event.target.value as PaymentModeDto)}
                >
                  {PAYMENT_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="pay-date">Payment date</Label>
                <Input
                  id="pay-date"
                  type="date"
                  className="mt-1.5"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  aria-invalid={Boolean(errors.paymentDate)}
                />
                {errors.paymentDate && (
                  <p className="mt-1.5 text-[11px] font-medium text-danger">
                    {errors.paymentDate}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="pay-notes">Payment notes (optional)</Label>
              <Input
                id="pay-notes"
                className="mt-1.5"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Receipt / transaction reference"
              />
            </div>
          </div>

          {row && (
            <div className="mt-6 flex items-center justify-between rounded-xl border border-line bg-card-hover/20 px-4 py-3">
              <span className="text-xs font-medium text-subtle">Balance after payment</span>
              <span className="text-sm font-bold tabular-nums text-gold">
                {formatCurrency(paiseToAmount(balanceAfter))}
              </span>
            </div>
          )}

          {row && (
            <p className="mt-3 text-[11px] text-faint">
              Recorded against {row.memberName}&apos;s {row.planName} membership ending{" "}
              {formatShortDate(row.endDate.slice(0, 10))}.
            </p>
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
          <Button type="submit" form={FORM_ID} variant="primary" size="md" disabled={submitting || !row}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
            ) : (
              <Wallet className="size-4" strokeWidth={2} aria-hidden />
            )}
            {submitting ? "Saving…" : "Record payment"}
          </Button>
        </div>
      </aside>
    </>
  );
}
