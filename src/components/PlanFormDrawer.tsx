"use client";

import { Layers, Loader2, Pencil, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  amountToPaise,
  createPlan,
  paiseToAmount,
  updatePlan,
  type PlanDto,
} from "@/lib/members-api";
import { useGlobalLoading } from "./providers/LoadingProvider";
import { useToast } from "./providers/ToastProvider";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

const FORM_ID = "plan-form";

type PlanFormValues = {
  name: string;
  price: string;
  durationMonths: string;
  isActive: boolean;
};

type PlanFormErrors = Partial<Record<keyof PlanFormValues, string>>;

const DURATION_PRESETS = [1, 3, 6, 12];

function emptyValues(): PlanFormValues {
  return { name: "", price: "", durationMonths: "1", isActive: true };
}

function toValues(plan: PlanDto): PlanFormValues {
  return {
    name: plan.name,
    price: String(paiseToAmount(plan.pricePaise)),
    durationMonths: String(plan.durationMonths),
    isActive: plan.isActive,
  };
}

function validate(values: PlanFormValues): PlanFormErrors {
  const errors: PlanFormErrors = {};
  if (values.name.trim().length < 2) errors.name = "Name must be at least 2 characters.";
  const price = Number(values.price);
  if (values.price.trim() === "" || Number.isNaN(price) || price < 0) {
    errors.price = "Enter a valid non-negative price.";
  }
  const duration = Number(values.durationMonths);
  if (!Number.isInteger(duration) || duration < 1 || duration > 60) {
    errors.durationMonths = "Duration must be between 1 and 60 months.";
  }
  return errors;
}

type PlanFormDrawerProps = {
  open: boolean;
  /** When provided the drawer edits this plan instead of creating one. */
  plan?: PlanDto | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: (plan: PlanDto) => void;
};

export function PlanFormDrawer({
  open,
  plan = null,
  onOpenChange,
  onSaved,
}: PlanFormDrawerProps) {
  const mode = plan ? "edit" : "create";
  const loading = useGlobalLoading();
  const toast = useToast();

  const initial = useMemo<PlanFormValues>(
    () => (plan ? toValues(plan) : emptyValues()),
    [plan],
  );
  const [values, setValues] = useState<PlanFormValues>(initial);
  const [errors, setErrors] = useState<PlanFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(plan ? toValues(plan) : emptyValues());
    setErrors({});
    setServerError(null);
    setSubmitting(false);
  }, [open, plan]);

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

  const setField = <K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const found = validate(values);
      setErrors(found);
      if (Object.keys(found).length > 0) return;

      setServerError(null);
      setSubmitting(true);
      try {
        const input = {
          name: values.name.trim(),
          pricePaise: amountToPaise(Number(values.price) || 0),
          durationMonths: Number(values.durationMonths),
          isActive: values.isActive,
        };
        const saved = await loading.run(
          mode === "edit" && plan
            ? updatePlan(plan.id, input)
            : createPlan(input),
          mode === "edit" ? "Saving plan…" : "Creating plan…",
        );
        toast.success(
          mode === "edit" ? "Plan updated" : "Plan created",
          `${saved.name} is ready to assign.`,
        );
        onSaved?.(saved);
        onOpenChange(false);
      } catch (caught) {
        const message =
          caught instanceof ApiError
            ? caught.message
            : "Something went wrong while saving. Please try again.";
        setServerError(message);
        toast.error("Couldn't save plan", message);
      } finally {
        setSubmitting(false);
      }
    },
    [loading, mode, onOpenChange, onSaved, plan, toast, values],
  );

  const monthly =
    Number(values.price) > 0 && Number(values.durationMonths) > 0
      ? Number(values.price) / Number(values.durationMonths)
      : 0;

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
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-card shadow-pop transition-transform duration-300 sm:max-w-lg",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-drawer-title"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line/60 px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              {mode === "edit" ? (
                <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
              ) : (
                <Layers className="size-4" strokeWidth={1.75} aria-hidden />
              )}
            </span>
            <h2 id="plan-drawer-title" className="text-sm font-semibold text-ink">
              {mode === "edit" ? "Edit plan" : "Create plan"}
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

          <div className="space-y-5">
            <div>
              <Label htmlFor="plan-name">Plan name</Label>
              <Input
                id="plan-name"
                className="mt-1.5"
                value={values.name}
                onChange={(event) => setField("name", event.target.value)}
                placeholder="e.g. Monthly Flex"
                autoFocus
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="plan-price">Price</Label>
                <Input
                  id="plan-price"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  className="mt-1.5"
                  value={values.price}
                  onChange={(event) => setField("price", event.target.value)}
                  placeholder="0.00"
                  aria-invalid={Boolean(errors.price)}
                />
                {errors.price ? (
                  <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.price}</p>
                ) : (
                  monthly > 0 && (
                    <p className="mt-1.5 text-[11px] text-faint">
                      ≈ ${monthly.toFixed(2)} / month
                    </p>
                  )
                )}
              </div>

              <div>
                <Label htmlFor="plan-duration">Duration (months)</Label>
                <Input
                  id="plan-duration"
                  type="number"
                  min={1}
                  max={60}
                  step={1}
                  inputMode="numeric"
                  className="mt-1.5"
                  value={values.durationMonths}
                  onChange={(event) => setField("durationMonths", event.target.value)}
                  aria-invalid={Boolean(errors.durationMonths)}
                />
                {errors.durationMonths ? (
                  <p className="mt-1.5 text-[11px] font-medium text-danger">
                    {errors.durationMonths}
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setField("durationMonths", String(preset))}
                        className={cn(
                          "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                          Number(values.durationMonths) === preset
                            ? "bg-gold/15 text-gold"
                            : "border border-line bg-card text-subtle hover:bg-card-hover hover:text-ink",
                        )}
                      >
                        {preset}mo
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {mode === "edit" && (
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-line bg-card-hover/30 px-4 py-3">
                <span>
                  <span className="block text-[13px] font-medium text-ink">Active</span>
                  <span className="mt-0.5 block text-[11px] text-faint">
                    Inactive plans stay on existing subscriptions but can&apos;t be assigned.
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="size-4 shrink-0 accent-[var(--color-gold)]"
                  checked={values.isActive}
                  onChange={(event) => setField("isActive", event.target.checked)}
                />
              </label>
            )}
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
          <Button type="submit" form={FORM_ID} variant="primary" size="md" disabled={submitting}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
            ) : mode === "edit" ? (
              <Pencil className="size-4" strokeWidth={2} aria-hidden />
            ) : (
              <Layers className="size-4" strokeWidth={2} aria-hidden />
            )}
            {submitting ? "Saving…" : mode === "edit" ? "Save changes" : "Create plan"}
          </Button>
        </div>
      </aside>
    </>
  );
}
