"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CreditCard, Loader2, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatLongDate } from "@/lib/format";
import {
  GENDER_OPTIONS,
  PAYMENT_MODE_OPTIONS,
  TIMING_OPTIONS,
  computeExpiry,
  computeFeePaise,
  hasErrors,
  validateMemberForm,
  type MemberFormErrors,
  type MemberFormValues,
} from "@/lib/member-form";
import { paiseToAmount, type PlanDto } from "@/lib/members-api";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";

export type MemberFormProps = {
  formId: string;
  /** `edit` shows the membership plan as already-assigned context. */
  mode: "create" | "edit";
  initialValues: MemberFormValues;
  plans: PlanDto[];
  plansLoading?: boolean;
  submitting?: boolean;
  serverError?: string | null;
  onSubmit: (values: MemberFormValues) => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-[11px] font-medium text-danger" role="alert">
      {message}
    </p>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof User;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3.5 text-gold" strokeWidth={1.75} aria-hidden />
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">
        {title}
      </h3>
      {hint && <span className="ml-auto text-[11px] text-faint">{hint}</span>}
    </div>
  );
}

export function MemberForm({
  formId,
  mode,
  initialValues,
  plans,
  plansLoading = false,
  submitting = false,
  serverError,
  onSubmit,
}: MemberFormProps) {
  const [values, setValues] = useState<MemberFormValues>(initialValues);
  const [errors, setErrors] = useState<MemberFormErrors>({});

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === values.planId),
    [plans, values.planId],
  );
  const feePaise = computeFeePaise(selectedPlan, values.discount);
  const expiry = computeExpiry(selectedPlan, values.startDate);

  // Keep the collected amount in sync with the plan fee/discount.
  useEffect(() => {
    if (!selectedPlan) return;
    const next = paiseToAmount(computeFeePaise(selectedPlan, values.discount)).toFixed(2);
    setValues((current) =>
      current.amount === next ? current : { ...current, amount: next },
    );
  }, [selectedPlan, values.discount]);

  const update = <K extends keyof MemberFormValues>(
    key: K,
    value: MemberFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // A second submit can arrive via Enter while the request is in flight.
    if (submitting) return;
    const nextErrors = validateMemberForm(values, {
      requireMembership: mode === "create",
    });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    onSubmit(values);
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="space-y-7"
      aria-busy={submitting}
      noValidate
    >
      {serverError && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-xs font-medium text-danger">
          {serverError}
        </div>
      )}

      {submitting && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2.5 rounded-lg border border-gold/30 bg-gold/10 px-3.5 py-2.5 text-xs font-medium text-gold"
        >
          <Loader2
            className="size-4 shrink-0 animate-spin"
            strokeWidth={2}
            aria-hidden
          />
          <span>
            {mode === "edit" ? "Saving changes…" : "Adding member…"} Please
            wait while we save the details.
          </span>
        </div>
      )}

      <fieldset
        disabled={submitting}
        className="m-0 min-w-0 space-y-7 border-0 p-0"
      >
      {/* Personal information */}
      <section className="space-y-4">
        <SectionTitle icon={User} title="Personal information" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">
              Member name <span className="text-gold">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Enter member's full name"
              required
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              aria-invalid={Boolean(errors.name)}
            />
            <FieldError message={errors.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Mobile number <span className="text-gold">*</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+1 (555) 000-0000"
              required
              value={values.phone}
              onChange={(event) => update("phone", event.target.value)}
              aria-invalid={Boolean(errors.phone)}
            />
            <FieldError message={errors.phone} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dateOfBirth">
              Date of birth <span className="text-gold">*</span>
            </Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              required
              value={values.dateOfBirth}
              onChange={(event) => update("dateOfBirth", event.target.value)}
              aria-invalid={Boolean(errors.dateOfBirth)}
            />
            <FieldError message={errors.dateOfBirth} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gender">
              Gender <span className="text-gold">*</span>
            </Label>
            <Select
              id="gender"
              name="gender"
              required
              value={values.gender}
              onChange={(event) => update("gender", event.target.value as MemberFormValues["gender"])}
              aria-invalid={Boolean(errors.gender)}
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError message={errors.gender} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="timing">
              Batch timing <span className="text-gold">*</span>
            </Label>
            <Select
              id="timing"
              name="timing"
              required
              value={values.timing}
              onChange={(event) => update("timing", event.target.value as MemberFormValues["timing"])}
              aria-invalid={Boolean(errors.timing)}
            >
              <option value="">Select batch timing</option>
              {TIMING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError message={errors.timing} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email">
              Email address <span className="text-faint">(optional)</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="member@example.com"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              aria-invalid={Boolean(errors.email)}
            />
            <FieldError message={errors.email} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">
              Address <span className="text-faint">(optional)</span>
            </Label>
            <Textarea
              id="address"
              name="address"
              rows={2}
              placeholder="Street address, city, state, ZIP"
              value={values.address}
              onChange={(event) => update("address", event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emergencyContact">
              Emergency contact <span className="text-faint">(optional)</span>
            </Label>
            <Input
              id="emergencyContact"
              name="emergencyContact"
              placeholder="Full name"
              value={values.emergencyContact}
              onChange={(event) => update("emergencyContact", event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emergencyPhone">
              Emergency phone <span className="text-faint">(optional)</span>
            </Label>
            <Input
              id="emergencyPhone"
              name="emergencyPhone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={values.emergencyPhone}
              onChange={(event) => update("emergencyPhone", event.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Membership */}
      <section className="space-y-4">
        <SectionTitle
          icon={CalendarClock}
          title="Membership"
          hint={mode === "edit" ? "Editing keeps the current plan" : undefined}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="planId">
              Membership plan{" "}
              {mode === "create" ? (
                <span className="text-gold">*</span>
              ) : (
                <span className="text-faint">(current)</span>
              )}
            </Label>
            <Select
              id="planId"
              name="planId"
              required={mode === "create"}
              value={values.planId}
              disabled={plansLoading || mode === "edit"}
              onChange={(event) => update("planId", event.target.value)}
              aria-invalid={Boolean(errors.planId)}
            >
              <option value="">
                {plansLoading ? "Loading plans…" : "Select a plan"}
              </option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — {formatCurrency(paiseToAmount(plan.pricePaise))} /{" "}
                  {plan.durationMonths} mo
                </option>
              ))}
            </Select>
            <FieldError message={errors.planId} />
            {mode === "create" && !plansLoading && plans.length === 0 && (
              <p className="text-[11px] font-medium text-warning">
                No active membership plans. Create a plan before adding a
                member.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="startDate">
              Start date{" "}
              {mode === "create" && <span className="text-gold">*</span>}
            </Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              required={mode === "create"}
              value={values.startDate}
              onChange={(event) => update("startDate", event.target.value)}
              aria-invalid={Boolean(errors.startDate)}
            />
            <FieldError message={errors.startDate} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="discount">
              Discount{" "}
              {mode === "create" && <span className="text-gold">*</span>}
            </Label>
            <Input
              id="discount"
              name="discount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0"
              required={mode === "create"}
              value={values.discount}
              onChange={(event) => update("discount", event.target.value)}
              aria-invalid={Boolean(errors.discount)}
            />
            <FieldError message={errors.discount} />
          </div>
        </div>

        {/* Fee preview */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-gold/25 bg-gradient-to-b from-gold/[0.1] to-transparent p-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              Plan fee
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-gold">
              {formatCurrency(paiseToAmount(feePaise))}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              Duration
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {selectedPlan ? `${selectedPlan.durationMonths} month${selectedPlan.durationMonths > 1 ? "s" : ""}` : "—"}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              Expires on
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {expiry ? formatLongDate(expiry.slice(0, 10)) : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* Payment */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle icon={CreditCard} title="Payment" />
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-subtle">
            <input
              type="checkbox"
              checked={values.collectPayment}
              onChange={(event) => update("collectPayment", event.target.checked)}
              className="size-3.5 rounded border-line bg-card accent-gold"
            />
            Collect payment now
          </label>
        </div>

        <div
          className={cn(
            "grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2",
            !values.collectPayment && "pointer-events-none opacity-45",
          )}
          aria-hidden={!values.collectPayment}
        >
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={values.amount}
              onChange={(event) => update("amount", event.target.value)}
              disabled={!values.collectPayment}
              aria-invalid={Boolean(errors.amount)}
            />
            <FieldError message={errors.amount} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paymentMode">Payment method</Label>
            <Select
              id="paymentMode"
              name="paymentMode"
              value={values.paymentMode}
              onChange={(event) =>
                update("paymentMode", event.target.value as MemberFormValues["paymentMode"])
              }
              disabled={!values.collectPayment}
            >
              {PAYMENT_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paymentDate">Payment date</Label>
            <Input
              id="paymentDate"
              name="paymentDate"
              type="date"
              value={values.paymentDate}
              onChange={(event) => update("paymentDate", event.target.value)}
              disabled={!values.collectPayment}
              aria-invalid={Boolean(errors.paymentDate)}
            />
            <FieldError message={errors.paymentDate} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reference">Reference / receipt note</Label>
            <Input
              id="reference"
              name="reference"
              placeholder="Transaction ID (optional)"
              value={values.reference}
              onChange={(event) => update("reference", event.target.value)}
              disabled={!values.collectPayment}
            />
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-4">
        <SectionTitle icon={User} title="Notes" hint="Optional" />
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Any special requirements or notes…"
          value={values.notes}
          onChange={(event) => update("notes", event.target.value)}
        />
      </section>
      </fieldset>
    </form>
  );
}
