"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";

import { useToast } from "@/components/providers/ToastProvider";
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
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/cn";
import {
  createPlatformGymOwner,
  listPlatformPlans,
  type CreatePlatformGymOwnerResult,
  type SubscriptionPlan,
} from "@/lib/api";
import { formatPaise } from "@/lib/super-admin-view";

type AccountMode = "PASSWORD" | "INVITE";

type CreateGymOwnerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful create so the parent can refresh its data. */
  onCreated?: (result: CreatePlatformGymOwnerResult) => void;
};

const EMPTY_FORM = {
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  gymName: "",
  gymEmail: "",
  gymPhone: "",
  gymAddress: "",
  mode: "PASSWORD" as AccountMode,
  password: "",
  planId: "",
};

/**
 * Super-admin onboarding form. Collects the owner, the gym and either a
 * password or an email invitation. The backend creates both records in one
 * transaction and applies the platform's free-trial / paid-plan rules.
 */
export function CreateGymOwnerDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateGymOwnerDialogProps) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = useCallback(
    <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const reset = useCallback(() => {
    setForm(EMPTY_FORM);
    setError(null);
  }, []);

  // Plans are only needed while the dialog is open. A failure to load them
  // leaves the free-trial option usable, so it is not a blocking error.
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let active = true;
    setPlansLoading(true);
    listPlatformPlans(controller.signal)
      .then((result) => {
        if (active) setPlans(result.filter((plan) => plan.isActive));
      })
      .catch(() => {
        if (active) setPlans([]);
      })
      .finally(() => {
        if (active) setPlansLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [open]);

  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === form.planId) ?? null,
    [plans, form.planId],
  );

  const close = useCallback(() => {
    if (!submitting) onOpenChange(false);
  }, [onOpenChange, submitting]);

  function validate(): string | null {
    if (form.ownerName.trim().length < 2) return "Enter the owner's full name.";
    if (!form.ownerEmail.trim()) return "Enter the owner's email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail.trim())) {
      return "Enter a valid owner email address.";
    }
    if (form.ownerPhone.replace(/\D/g, "").length < 10) {
      return "Enter a valid mobile number with at least 10 digits.";
    }
    if (form.gymName.trim().length < 2) return "Enter the gym name.";
    if (form.mode === "PASSWORD" && form.password.length < 8) {
      return "The password must be at least 8 characters.";
    }
    if (form.gymAddress.trim().length > 300) {
      return "Keep the gym address under 300 characters.";
    }
    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setSubmitting(true);
    const toastId = toast.loading(
      "Creating gym owner…",
      "Creating the gym, owner account and subscription.",
    );

    try {
      const result = await createPlatformGymOwner({
        ownerName: form.ownerName.trim(),
        ownerEmail: form.ownerEmail.trim().toLowerCase(),
        ownerPhone: form.ownerPhone.trim(),
        gymName: form.gymName.trim(),
        gymEmail: form.gymEmail.trim() || undefined,
        gymPhone: form.gymPhone.trim() || undefined,
        gymAddress: form.gymAddress.trim() || undefined,
        mode: form.mode,
        password: form.mode === "PASSWORD" ? form.password : undefined,
        planId: form.planId || undefined,
      });

      const data = result?.data;
      if (!data) throw new Error("The server did not return the created gym.");

      const subscriptionLabel = data.subscription
        ? data.subscription.plan?.name ??
          data.subscription.planNameSnapshot ??
          "Free trial"
        : "No subscription";
      const invitationWarning = data.invitation?.warning;

      toast.update(toastId, {
        variant: invitationWarning ? "warning" : "success",
        title: invitationWarning ? "Gym created — invitation not sent" : "Gym owner created",
        description:
          invitationWarning ??
          `${data.owner.name} can now sign in and manage ${data.gym.name}. ${subscriptionLabel}.`,
        persistent: false,
      });

      reset();
      onCreated?.(data);
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not create the gym owner. Please try again.";
      setError(message);
      toast.update(toastId, {
        variant: "error",
        title: "Couldn't create gym owner",
        description: message,
        persistent: false,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next);
      }}
    >
      <DialogContent className="p-0">
        <div className="flex items-start gap-3 border-b border-line/70 px-5 py-4">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
            <UserPlus className="size-4.5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-[15px] text-ink">Create gym owner</DialogTitle>
            <DialogDescription className="mt-0.5">
              Creates the gym and its OWNER account together, then applies the
              platform&apos;s free trial or chosen plan.
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              disabled={submitting}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-card-hover hover:text-ink disabled:opacity-40"
              aria-label="Close"
            >
              <X className="size-4" strokeWidth={2} aria-hidden />
            </button>
          </DialogClose>
        </div>

        <form onSubmit={submit} className="max-h-[calc(100vh-11rem)] overflow-y-auto">
          <div className="space-y-5 px-5 py-5">
            {/* Owner */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-gold" strokeWidth={1.75} aria-hidden />
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-faint">
                  Owner account
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="owner-name">
                    Owner name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="owner-name"
                    value={form.ownerName}
                    onChange={(event) => setField("ownerName", event.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    autoComplete="off"
                    maxLength={100}
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="owner-phone">
                    Mobile number <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="owner-phone"
                    type="tel"
                    value={form.ownerPhone}
                    onChange={(event) => setField("ownerPhone", event.target.value)}
                    placeholder="+91 98765 43210"
                    autoComplete="off"
                    maxLength={16}
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="owner-email">
                    Email address <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="owner-email"
                    type="email"
                    value={form.ownerEmail}
                    onChange={(event) => setField("ownerEmail", event.target.value)}
                    placeholder="owner@example.com"
                    autoComplete="off"
                    required
                    disabled={submitting}
                  />
                  <p className="text-[11px] text-faint">
                    This is the sign-in identity. Email and mobile must be unique
                    across the platform.
                  </p>
                </div>
              </div>
            </section>

            {/* Gym */}
            <section className="space-y-3 border-t border-line/60 pt-4">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-gold" strokeWidth={1.75} aria-hidden />
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-faint">
                  Gym
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="gym-name">
                    Gym name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="gym-name"
                    value={form.gymName}
                    onChange={(event) => setField("gymName", event.target.value)}
                    placeholder="e.g. Iron House Fitness"
                    maxLength={120}
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gym-email">Gym email (optional)</Label>
                  <Input
                    id="gym-email"
                    type="email"
                    value={form.gymEmail}
                    onChange={(event) => setField("gymEmail", event.target.value)}
                    placeholder="Defaults to the owner email"
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gym-phone">Gym phone (optional)</Label>
                  <Input
                    id="gym-phone"
                    type="tel"
                    value={form.gymPhone}
                    onChange={(event) => setField("gymPhone", event.target.value)}
                    placeholder="Defaults to the mobile number"
                    maxLength={16}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="gym-address">Address (optional)</Label>
                  <Textarea
                    id="gym-address"
                    value={form.gymAddress}
                    onChange={(event) => setField("gymAddress", event.target.value)}
                    placeholder="Street, area, city"
                    rows={2}
                    maxLength={300}
                    disabled={submitting}
                  />
                </div>
              </div>
            </section>

            {/* Credentials */}
            <section className="space-y-3 border-t border-line/60 pt-4">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-gold" strokeWidth={1.75} aria-hidden />
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-faint">
                  Account access
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      value: "PASSWORD" as const,
                      title: "Set a password",
                      hint: "Share it with the owner securely",
                    },
                    {
                      value: "INVITE" as const,
                      title: "Email an invitation",
                      hint: "Owner sets their own password",
                    },
                  ]
                ).map((option) => {
                  const active = form.mode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setField("mode", option.value)}
                      disabled={submitting}
                      aria-pressed={active}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left transition-colors",
                        active
                          ? "border-gold/45 bg-gold/10"
                          : "border-line bg-card/40 hover:border-line-strong",
                      )}
                    >
                      <span
                        className={cn(
                          "flex items-center gap-1.5 text-[12.5px] font-medium",
                          active ? "text-gold" : "text-ink",
                        )}
                      >
                        {active && (
                          <CheckCircle2 className="size-3.5" strokeWidth={2} aria-hidden />
                        )}
                        {option.title}
                      </span>
                      <span className="mt-0.5 block text-[10.5px] text-faint">
                        {option.hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              {form.mode === "PASSWORD" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="owner-password">
                    Temporary password <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="owner-password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setField("password", event.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    disabled={submitting}
                  />
                  <p className="text-[11px] text-faint">
                    Hashed with the same Better Auth credential system as normal
                    sign-in. The owner can change it later.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-gold/25 bg-gold/8 px-3 py-2.5 text-[11.5px] leading-relaxed text-subtle">
                  We&apos;ll email a secure password-setup link to{" "}
                  <span className="font-medium text-ink">
                    {form.ownerEmail.trim() || "the owner"}
                  </span>
                  . No password is known to the platform administrator.
                </div>
              )}
            </section>

            {/* Subscription */}
            <section className="space-y-3 border-t border-line/60 pt-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-gold" strokeWidth={1.75} aria-hidden />
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-faint">
                  SaaS subscription
                </h3>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-select">Initial plan</Label>
                <Select
                  id="plan-select"
                  value={form.planId}
                  onChange={(event) => setField("planId", event.target.value)}
                  disabled={submitting || plansLoading}
                >
                  <option value="">
                    Free trial (uses the platform&apos;s current trial rules)
                  </option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — {formatPaise(plan.pricePaise)} /{" "}
                      {plan.durationMonths} mo
                    </option>
                  ))}
                </Select>
                <p className="text-[11px] text-faint">
                  {plansLoading
                    ? "Loading plans…"
                    : activePlan
                      ? "The paid period starts today and no payment row is created — this is an audited platform grant."
                      : "The gym gets the existing one-time free trial. If trials are disabled, choose a paid plan."}
                </p>
              </div>
            </section>

            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger/8 px-3 py-2 text-[12px] leading-relaxed text-danger">
                {error}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line/70 bg-[#151515]/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10.5px] text-faint">
              Creates a real PostgreSQL gym + owner and writes a
              GYM_CREATED audit entry.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={close}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
                ) : (
                  <UserPlus className="size-4" strokeWidth={2} aria-hidden />
                )}
                {submitting ? "Creating…" : "Create gym owner"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
