"use client";

import { CalendarPlus, Check, Loader2, Repeat, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import {
  PAYMENT_MODE_OPTIONS,
  todayIso,
} from "@/lib/member-form";
import {
  addMonths,
  amountToPaise,
  createMembership,
  createPayment,
  paiseToAmount,
  type MemberDto,
  type PaymentModeDto,
  type PlanDto,
} from "@/lib/members-api";
import type { SubscriptionRow } from "@/lib/membership-view";
import { useGlobalLoading } from "./providers/LoadingProvider";
import { useToast } from "./providers/ToastProvider";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";

const FORM_ID = "assign-membership-form";

type AssignMembershipDrawerProps = {
  open: boolean;
  plans: PlanDto[];
  members: MemberDto[];
  /** When set, the drawer renews this subscription instead of a fresh assign. */
  renewal?: SubscriptionRow | null;
  /** Optional plan to preselect when assigning fresh. */
  initialPlanId?: string | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

function nextStartDate(renewal: SubscriptionRow | null): string {
  if (!renewal) return todayIso();
  const end = new Date(renewal.endDate);
  const today = new Date();
  const base = end.getTime() > today.getTime() ? end : today;
  // Renewals begin the day after the current term ends.
  base.setDate(base.getDate() + 1);
  return base.toISOString().slice(0, 10);
}

export function AssignMembershipDrawer({
  open,
  plans,
  members,
  renewal = null,
  initialPlanId = null,
  onOpenChange,
  onSaved,
}: AssignMembershipDrawerProps) {
  const loading = useGlobalLoading();
  const toast = useToast();

  const [memberId, setMemberId] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [discount, setDiscount] = useState("0");
  const [collectPayment, setCollectPayment] = useState(true);
  const [amount, setAmount] = useState("");
  const [amountEdited, setAmountEdited] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentModeDto>("CASH");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset the form each time the drawer opens.
  useEffect(() => {
    if (!open) return;
    const renewalPlanActive = renewal
      ? plans.some((plan) => plan.id === renewal.planId)
      : false;
    const preselect = initialPlanId && plans.some((plan) => plan.id === initialPlanId)
      ? initialPlanId
      : null;
    setMemberId(renewal?.memberId ?? "");
    setMemberQuery("");
    setPlanId(
      renewal && renewalPlanActive
        ? renewal.planId
        : renewal
          ? ""
          : (preselect ?? plans[0]?.id ?? ""),
    );
    setStartDate(nextStartDate(renewal));
    setDiscount("0");
    setCollectPayment(true);
    setAmount("");
    setAmountEdited(false);
    setPaymentMode("CASH");
    setReference("");
    setPaymentDate(todayIso());
    setSubmitting(false);
    setServerError(null);
    setErrors({});
  }, [open, renewal, plans, initialPlanId]);

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

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === planId) ?? null,
    [plans, planId],
  );

  const feePaise = useMemo(() => {
    if (!selectedPlan) return 0;
    const discountPaise = Math.max(0, Math.round((Number(discount) || 0) * 100));
    return Math.max(0, selectedPlan.pricePaise - discountPaise);
  }, [selectedPlan, discount]);

  // Keep the collected amount in sync with the computed fee until the user edits it.
  useEffect(() => {
    if (!amountEdited) setAmount(feePaise > 0 ? String(paiseToAmount(feePaise)) : "");
  }, [feePaise, amountEdited]);

  const expiryPreview = useMemo(() => {
    if (!selectedPlan || !startDate) return null;
    const iso = addMonths(startDate, selectedPlan.durationMonths);
    if (Number.isNaN(new Date(iso).getTime())) return null;
    return iso.slice(0, 10);
  }, [selectedPlan, startDate]);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === memberId) ?? null,
    [members, memberId],
  );

  const filteredMembers = useMemo(() => {
    const term = memberQuery.trim().toLowerCase();
    const list = !term
      ? members
      : members.filter((member) =>
          `${member.name} ${member.memberCode} ${member.phone}`.toLowerCase().includes(term),
        );
    return list.slice(0, 8);
  }, [members, memberQuery]);

  const validate = useCallback(() => {
    const found: Record<string, string> = {};
    if (!memberId) found.memberId = "Select a member.";
    if (!planId) found.planId = "Select a plan.";
    if (!startDate) found.startDate = "Start date is required.";
    const discountValue = Number(discount);
    if (discount.trim() !== "" && (Number.isNaN(discountValue) || discountValue < 0)) {
      found.discount = "Discount must be zero or more.";
    }
    if (collectPayment) {
      const amountValue = Number(amount);
      if (amount.trim() === "" || Number.isNaN(amountValue) || amountValue <= 0) {
        found.amount = "Enter an amount greater than zero.";
      }
      if (!paymentDate) found.paymentDate = "Payment date is required.";
    }
    return found;
  }, [memberId, planId, startDate, discount, collectPayment, amount, paymentDate]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const found = validate();
      setErrors(found);
      if (Object.keys(found).length > 0) return;

      setServerError(null);
      setSubmitting(true);
      try {
        await loading.run(
          (async () => {
            await createMembership({
              memberId,
              planId,
              startDate: startDate || undefined,
              discountPaise: Math.max(0, Math.round((Number(discount) || 0) * 100)),
            });
            if (collectPayment) {
              await createPayment({
                memberId,
                amount: amountToPaise(Number(amount) || 0),
                paymentMode,
                reference: reference.trim() || null,
                paymentDate,
                status: "SUCCESS",
              });
            }
          })(),
          renewal ? "Renewing membership…" : "Assigning membership…",
        );
        toast.success(
          renewal ? "Membership renewed" : "Membership assigned",
          selectedMember
            ? `${selectedMember.name}'s subscription is active.`
            : "The subscription is active.",
        );
        onSaved?.();
        onOpenChange(false);
      } catch (caught) {
        const message =
          caught instanceof ApiError
            ? caught.message
            : "Something went wrong while saving. Please try again.";
        setServerError(message);
        toast.error("Couldn't save membership", message);
      } finally {
        setSubmitting(false);
      }
    },
    [
      amount,
      collectPayment,
      discount,
      loading,
      memberId,
      onOpenChange,
      onSaved,
      paymentDate,
      paymentMode,
      planId,
      reference,
      renewal,
      selectedMember,
      startDate,
      toast,
      validate,
    ],
  );

  const noPlans = plans.length === 0;

  const paidPreviewPaise =
    collectPayment && amount.trim() !== "" && !Number.isNaN(Number(amount))
      ? Math.max(0, amountToPaise(Number(amount)))
      : 0;
  const outstandingPreviewPaise = Math.max(0, feePaise - Math.min(paidPreviewPaise, feePaise));

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
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-card shadow-pop transition-transform duration-300 sm:max-w-xl",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-drawer-title"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line/60 px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              {renewal ? (
                <Repeat className="size-4" strokeWidth={1.75} aria-hidden />
              ) : (
                <CalendarPlus className="size-4" strokeWidth={1.75} aria-hidden />
              )}
            </span>
            <h2 id="assign-drawer-title" className="text-sm font-semibold text-ink">
              {renewal ? "Renew membership" : "Assign membership"}
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

          {noPlans && (
            <div className="mb-5 rounded-lg border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-xs font-medium text-warning">
              No active plans available. Create a plan before assigning a membership.
            </div>
          )}

          {/* Member */}
          <div>
            <Label>Member</Label>
            {selectedMember ? (
              <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-line bg-card-hover/40 px-3 py-2.5">
                <Avatar
                  initials={selectedMember.name.slice(0, 2).toUpperCase()}
                  className="size-8 text-[10px]"
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
                  onClick={() => {
                    setMemberId("");
                    setMemberQuery("");
                  }}
                  className="text-[11px] font-medium text-gold transition-colors hover:underline"
                >
                  Change
                </button>
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
                    value={memberQuery}
                    onChange={(event) => setMemberQuery(event.target.value)}
                    placeholder="Search members by name, code, or phone…"
                    className="pl-9"
                    aria-label="Search members"
                    autoFocus
                  />
                </div>
                <div className="scroll-thin mt-2 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-line bg-card/60 p-1.5">
                  {filteredMembers.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-faint">
                      No members match your search.
                    </p>
                  ) : (
                    filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setMemberId(member.id)}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-card-hover"
                      >
                        <Avatar
                          initials={member.name.slice(0, 2).toUpperCase()}
                          className="size-7 text-[10px]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-ink">
                            {member.name}
                          </span>
                          <span className="block truncate font-mono text-[11px] text-faint">
                            {member.memberCode} · {member.phone}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
            {errors.memberId && (
              <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.memberId}</p>
            )}
          </div>

          {/* Plan */}
          <div className="mt-6">
            <Label>Plan</Label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {plans.map((plan) => {
                const active = planId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setPlanId(plan.id);
                      setAmountEdited(false);
                    }}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col rounded-xl border px-4 py-3 text-left transition-colors",
                      active
                        ? "border-gold/50 bg-gold/10"
                        : "border-line bg-card hover:border-line-strong hover:bg-card-hover",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-ink">
                        {plan.name}
                      </span>
                      {active && <Check className="size-3.5 shrink-0 text-gold" strokeWidth={2.5} aria-hidden />}
                    </span>
                    <span className="mt-1 text-[13px] font-bold tabular-nums text-gold">
                      {formatCurrency(paiseToAmount(plan.pricePaise))}
                    </span>
                    <span className="mt-0.5 text-[11px] text-faint">
                      {plan.durationMonths} month{plan.durationMonths === 1 ? "" : "s"}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.planId && (
              <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.planId}</p>
            )}
            {renewal && !plans.some((plan) => plan.id === renewal.planId) && (
              <p className="mt-2 text-[11px] text-warning">
                The original plan ({renewal.planName}) is no longer active. Choose a plan to renew
                with.
              </p>
            )}
          </div>

          {/* Dates + discount */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="assign-start">Start date</Label>
              <Input
                id="assign-start"
                type="date"
                className="mt-1.5"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                aria-invalid={Boolean(errors.startDate)}
              />
              {errors.startDate && (
                <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.startDate}</p>
              )}
            </div>
            <div>
              <Label htmlFor="assign-discount">Discount</Label>
              <Input
                id="assign-discount"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                className="mt-1.5"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                placeholder="0.00"
                aria-invalid={Boolean(errors.discount)}
              />
              {errors.discount ? (
                <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.discount}</p>
              ) : (
                expiryPreview && (
                  <p className="mt-1.5 text-[11px] text-faint">
                    Expires {expiryPreview}
                  </p>
                )
              )}
            </div>
          </div>

          {/* Fee summary */}
          <div className="mt-6 rounded-xl border border-gold/25 bg-gradient-to-b from-gold/[0.08] to-transparent p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-subtle">Membership fee</span>
              <span className="text-lg font-bold tabular-nums text-gold">
                {formatCurrency(paiseToAmount(feePaise))}
              </span>
            </div>
            {Number(discount) > 0 && selectedPlan && (
              <p className="mt-1 text-[11px] text-faint">
                {formatCurrency(paiseToAmount(selectedPlan.pricePaise))} −{" "}
                {formatCurrency(Number(discount) || 0)} discount
              </p>
            )}
          </div>

          {/* Payment */}
          <div className="mt-6">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                className="size-4 accent-[var(--color-gold)]"
                checked={collectPayment}
                onChange={(event) => setCollectPayment(event.target.checked)}
              />
              <span className="text-[13px] font-medium text-ink">Collect payment now</span>
            </label>

            {collectPayment && (
              <div className="mt-4 space-y-5 rounded-xl border border-line bg-card-hover/20 p-4">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="assign-amount">Amount</Label>
                    <Input
                      id="assign-amount"
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      className="mt-1.5"
                      value={amount}
                      onChange={(event) => {
                        setAmountEdited(true);
                        setAmount(event.target.value);
                      }}
                      aria-invalid={Boolean(errors.amount)}
                    />
                    {errors.amount && (
                      <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.amount}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="assign-mode">Payment mode</Label>
                    <Select
                      id="assign-mode"
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
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="assign-ref">Reference (optional)</Label>
                    <Input
                      id="assign-ref"
                      className="mt-1.5"
                      value={reference}
                      onChange={(event) => setReference(event.target.value)}
                      placeholder="Receipt / txn id"
                    />
                  </div>
                  <div>
                    <Label htmlFor="assign-paydate">Payment date</Label>
                    <Input
                      id="assign-paydate"
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
              </div>
            )}
          </div>

          {/* Assignment summary */}
          <div className="mt-6 rounded-xl border border-line bg-card-hover/20 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
              Summary
            </p>
            <dl className="mt-3 space-y-2 text-[13px]">
              <SummaryRow label="Member" value={selectedMember?.name ?? "—"} />
              <SummaryRow label="Plan" value={selectedPlan?.name ?? "—"} />
              <SummaryRow
                label="Total fee"
                value={formatCurrency(paiseToAmount(feePaise))}
              />
              <SummaryRow
                label="Amount paid"
                value={formatCurrency(paiseToAmount(paidPreviewPaise))}
                valueClassName="text-success"
              />
              <div className="flex items-center justify-between border-t border-line/50 pt-2">
                <dt className="font-medium text-subtle">Outstanding balance</dt>
                <dd
                  className={cn(
                    "font-bold tabular-nums",
                    outstandingPreviewPaise > 0 ? "text-warning" : "text-success",
                  )}
                >
                  {formatCurrency(paiseToAmount(outstandingPreviewPaise))}
                </dd>
              </div>
            </dl>
          </div>
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
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            size="md"
            disabled={submitting || noPlans}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
            ) : renewal ? (
              <Repeat className="size-4" strokeWidth={2} aria-hidden />
            ) : (
              <CalendarPlus className="size-4" strokeWidth={2} aria-hidden />
            )}
            {submitting ? "Saving…" : renewal ? "Renew membership" : "Assign membership"}
          </Button>
        </div>
      </aside>
    </>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-subtle">{label}</dt>
      <dd className={cn("truncate font-medium text-ink", valueClassName)}>{value}</dd>
    </div>
  );
}
