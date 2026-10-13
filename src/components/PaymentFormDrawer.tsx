"use client";

import { Check, CreditCard, Loader2, Search, Wallet, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { PAYMENT_MODE_OPTIONS, todayIso } from "@/lib/member-form";
import {
  amountToPaise,
  createPayment,
  deriveStatus,
  getInitials,
  type MemberDto,
  type PaymentModeDto,
} from "@/lib/members-api";
import { statusTone } from "@/lib/member-ui";
import { useGlobalLoading } from "./providers/LoadingProvider";
import { useToast } from "./providers/ToastProvider";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";

const FORM_ID = "record-payment-form";

type PaymentFormDrawerProps = {
  open: boolean;
  members: MemberDto[];
  presetMemberId?: string | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function PaymentFormDrawer({
  open,
  members,
  presetMemberId = null,
  onOpenChange,
  onSaved,
}: PaymentFormDrawerProps) {
  const loading = useGlobalLoading();
  const toast = useToast();

  const [memberId, setMemberId] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentModeDto>("CASH");
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [reference, setReference] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMemberId(presetMemberId ?? "");
    setMemberQuery("");
    setAmount("");
    setPaymentMode("CASH");
    setPaymentDate(todayIso());
    setReference("");
    setErrors({});
    setServerError(null);
    setSubmitting(false);
  }, [open, presetMemberId]);

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

  const selectedMembership = selectedMember?.memberships?.[0] ?? null;
  const memberStatus = selectedMembership ? deriveStatus(selectedMembership) : null;

  const filteredMembers = useMemo(() => {
    const term = memberQuery.trim().toLowerCase();
    const list = !term
      ? members
      : members.filter((member) =>
          `${member.name} ${member.memberCode} ${member.phone}`
            .toLowerCase()
            .includes(term),
        );
    return list.slice(0, 8);
  }, [members, memberQuery]);

  const amountPaise = amount.trim() === "" ? 0 : amountToPaise(Number(amount) || 0);
  const isFuture = paymentDate > todayIso();

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const found: Record<string, string> = {};
      const value = Number(amount);
      if (!memberId) found.memberId = "Select a member.";
      if (amount.trim() === "" || Number.isNaN(value) || value <= 0) {
        found.amount = "Enter an amount greater than zero.";
      }
      if (!paymentDate) found.paymentDate = "Payment date is required.";
      else if (isFuture) found.paymentDate = "Payment date can't be in the future.";
      setErrors(found);
      if (Object.keys(found).length > 0) return;

      setServerError(null);
      setSubmitting(true);
      try {
        await loading.run(
          createPayment({
            memberId,
            amount: amountToPaise(value),
            paymentMode,
            reference: reference.trim() || null,
            paymentDate,
            status: "SUCCESS",
          }),
          "Recording payment…",
        );
        toast.success(
          "Payment recorded",
          `${formatCurrency(value)} received from ${selectedMember?.name ?? "member"}.`,
        );
        onSaved();
        onOpenChange(false);
      } catch (caught) {
        const message =
          caught instanceof ApiError ? caught.message : "Please try again.";
        setServerError(message);
        toast.error("Couldn't record payment", message);
      } finally {
        setSubmitting(false);
      }
    },
    [
      amount,
      isFuture,
      loading,
      memberId,
      onOpenChange,
      onSaved,
      paymentDate,
      paymentMode,
      reference,
      selectedMember,
      toast,
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
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-card shadow-pop transition-transform duration-300 sm:max-w-md",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-form-title"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line/60 px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <Wallet className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <h2 id="payment-form-title" className="text-sm font-semibold text-ink">
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

          {/* Member */}
          <div>
            <Label htmlFor="pay-member">Member</Label>
            {selectedMember ? (
              <div className="mt-1.5 rounded-lg border border-line bg-card-hover/40 px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <Avatar initials={getInitials(selectedMember.name)} className="size-9" />
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
                {(selectedMembership || memberStatus) && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line/50 pt-2.5">
                    <Badge tone="gold">
                      {selectedMembership?.plan?.name ?? "No plan"}
                    </Badge>
                    {memberStatus && (
                      <Badge tone={statusTone(memberStatus)} dot>
                        {memberStatus}
                      </Badge>
                    )}
                    {selectedMembership && (
                      <span className="text-[11px] text-faint">
                        Ends {selectedMembership.endDate.slice(0, 10)}
                      </span>
                    )}
                  </div>
                )}
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
                    id="pay-member"
                    className="pl-9"
                    value={memberQuery}
                    onChange={(event) => setMemberQuery(event.target.value)}
                    placeholder="Search by name, phone or member ID"
                    aria-invalid={Boolean(errors.memberId)}
                    autoFocus
                  />
                </div>
                {errors.memberId && (
                  <p className="mt-1.5 text-[11px] font-medium text-danger">
                    {errors.memberId}
                  </p>
                )}
                {members.length === 0 ? (
                  <p className="mt-2 text-[11px] text-faint">No members available.</p>
                ) : (
                  <ul className="scroll-thin mt-2 max-h-60 space-y-1 overflow-y-auto">
                    {filteredMembers.map((member) => (
                      <li key={member.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setMemberId(member.id);
                            setErrors((current) => {
                              if (!current.memberId) return current;
                              const next = { ...current };
                              delete next.memberId;
                              return next;
                            });
                          }}
                          className="flex w-full items-center gap-3 rounded-lg border border-line/60 bg-card-hover/20 px-3 py-2 text-left transition-colors hover:border-line-strong hover:bg-card-hover/60"
                        >
                          <Avatar
                            initials={getInitials(member.name)}
                            className="size-8 text-[10px]"
                          />
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
                      <li className="px-3 py-2 text-[11px] text-faint">
                        No matching members.
                      </li>
                    )}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* Amount */}
          <div className="mt-5">
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
              placeholder="0.00"
              aria-invalid={Boolean(errors.amount)}
            />
            {errors.amount ? (
              <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.amount}</p>
            ) : amountPaise > 0 ? (
              <p className="mt-1.5 text-[11px] text-faint">
                {formatCurrency(Number(amount) || 0)} will be recorded.
              </p>
            ) : null}
          </div>

          {/* Method + date */}
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="pay-mode">Payment method</Label>
              <Select
                id="pay-mode"
                className="mt-1.5"
                value={paymentMode}
                onChange={(event) =>
                  setPaymentMode(event.target.value as PaymentModeDto)
                }
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
                max={todayIso()}
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

          {/* Reference */}
          <div className="mt-5">
            <Label htmlFor="pay-reference">Reference (optional)</Label>
            <Input
              id="pay-reference"
              className="mt-1.5"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Receipt / transaction reference"
            />
          </div>

          {/* Status */}
          <div className="mt-5 flex items-center justify-between rounded-xl border border-line bg-card-hover/20 px-4 py-3">
            <span className="text-xs text-faint">Payment status</span>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink">
              <CreditCard className="size-3.5 text-faint" strokeWidth={1.75} aria-hidden />
              Success
            </span>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-faint">
            A unique receipt number is generated automatically by the server when the
            payment is saved.
          </p>
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
