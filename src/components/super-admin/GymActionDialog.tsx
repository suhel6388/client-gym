"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  CreditCard,
  Loader2,
  Play,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/providers/ToastProvider";
import { cn } from "@/lib/cn";
import {
  assignPlatformPlan,
  endPlatformTrial,
  extendPlatformExpiry,
  setPlatformAccess,
  startPlatformTrial,
  type PlatformGymDetail,
  type SubscriptionPlan,
} from "@/lib/api";
import { formatPaise, formatPlatformDate } from "@/lib/super-admin-view";

export type GymActionMode =
  | "plan"
  | "extend"
  | "trial"
  | "end-trial"
  | "suspend"
  | "activate";

const MODE_META: Record<
  GymActionMode,
  {
    title: string;
    description: string;
    confirm: string;
    success: string;
    danger?: boolean;
    icon: typeof CreditCard;
  }
> = {
  plan: {
    title: "Assign subscription plan",
    description:
      "Start a paid period from now (or a chosen expiry). No payment row is created — this is a platform grant and is fully audited.",
    confirm: "Save plan",
    success: "Plan updated",
    icon: CreditCard,
  },
  extend: {
    title: "Extend expiry",
    description:
      "Add days to the current period or set an explicit future expiry. Expired paid plans are reactivated; suspended gyms stay suspended.",
    confirm: "Extend",
    success: "Expiry updated",
    icon: CalendarPlus,
  },
  trial: {
    title: "Start or extend trial",
    description:
      "Grants free access for the chosen number of days. Active paid subscriptions must be suspended or expired first.",
    confirm: "Save trial",
    success: "Trial updated",
    icon: CalendarClock,
  },
  "end-trial": {
    title: "End trial now",
    description:
      "Immediately expires the trial. The gym loses access until a paid plan is assigned or access is reactivated.",
    confirm: "End trial",
    success: "Trial ended",
    danger: true,
    icon: Ban,
  },
  suspend: {
    title: "Suspend gym access",
    description:
      "Blocks every gym user immediately while preserving billing dates. The gym can be reactivated later without losing its period.",
    confirm: "Suspend access",
    success: "Gym suspended",
    danger: true,
    icon: Ban,
  },
  activate: {
    title: "Activate gym access",
    description:
      "Restores access. If the paid period already ended, choosing a new expiry date is required.",
    confirm: "Activate gym",
    success: "Gym activated",
    icon: Play,
  },
};

/** Convert a date input value to the end of that day in the admin's timezone. */
function dateInputToIso(value: string): string {
  return new Date(`${value}T23:59:59`).toISOString();
}

function isFutureDateInput(value: string): boolean {
  if (!value) return false;
  const date = new Date(`${value}T23:59:59`);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

type GymActionDialogProps = {
  mode: GymActionMode;
  gym: PlatformGymDetail["gym"];
  subscription: PlatformGymDetail["subscription"];
  effectiveStatus: PlatformGymDetail["effectiveStatus"];
  plans: SubscriptionPlan[];
  onClose: () => void;
  onSaved: () => void;
};

export function GymActionDialog({
  mode,
  gym,
  subscription,
  effectiveStatus,
  plans,
  onClose,
  onSaved,
}: GymActionDialogProps) {
  const toast = useToast();
  const meta = MODE_META[mode];
  const Icon = meta.icon;

  const activePlans = useMemo(() => plans.filter((plan) => plan.isActive), [plans]);
  const planChoices = activePlans.length > 0 ? activePlans : plans;

  const [planId, setPlanId] = useState(
    subscription?.planId ?? planChoices[0]?.id ?? "",
  );
  const [expiresAt, setExpiresAt] = useState("");
  const [days, setDays] = useState(mode === "extend" ? "30" : "14");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsExpiry =
    mode === "activate" &&
    !(subscription?.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > new Date());

  const close = useCallback(() => {
    if (!submitting) onClose();
  }, [onClose, submitting]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  async function submit() {
    setError(null);
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 3) {
      setError("Add a short reason (at least 3 characters) for the audit log.");
      return;
    }

    if (mode === "plan" && !planId) {
      setError("Choose a plan to assign.");
      return;
    }
    if ((mode === "plan" || mode === "extend" || mode === "activate") && expiresAt) {
      if (!isFutureDateInput(expiresAt)) {
        setError("The expiry must be a future date.");
        return;
      }
    }
    if (mode === "extend" && !expiresAt) {
      const numericDays = Number(days);
      if (!Number.isInteger(numericDays) || numericDays < 1 || numericDays > 3650) {
        setError("Enter a whole number of days between 1 and 3650.");
        return;
      }
    }
    if (mode === "trial") {
      const numericDays = Number(days);
      if (!Number.isInteger(numericDays) || numericDays < 1 || numericDays > 365) {
        setError("Trial length must be a whole number between 1 and 365 days.");
        return;
      }
    }
    if (needsExpiry && !expiresAt) {
      setError("This subscription has ended. Choose a new expiry date to activate it.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "plan") {
        await assignPlatformPlan(gym.id, {
          planId,
          expiresAt: expiresAt ? dateInputToIso(expiresAt) : undefined,
          reason: trimmedReason,
        });
      } else if (mode === "extend") {
        await extendPlatformExpiry(gym.id, {
          ...(expiresAt
            ? { expiresAt: dateInputToIso(expiresAt) }
            : { additionalDays: Number(days) }),
          reason: trimmedReason,
        });
      } else if (mode === "trial") {
        await startPlatformTrial(gym.id, {
          days: Number(days),
          reason: trimmedReason,
        });
      } else if (mode === "end-trial") {
        await endPlatformTrial(gym.id, trimmedReason);
      } else {
        await setPlatformAccess(gym.id, {
          status: mode === "suspend" ? "SUSPENDED" : "ACTIVE",
          expiresAt: expiresAt ? dateInputToIso(expiresAt) : undefined,
          reason: trimmedReason,
        });
      }

      toast.success(
        meta.success,
        `${gym.name} · the action was recorded in the platform audit log.`,
      );
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The action could not be completed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const currentPlanName =
    subscription?.plan?.name ??
    subscription?.planNameSnapshot ??
    (effectiveStatus === "TRIALING" ? "Free trial" : "No plan");

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gym-action-title"
        className="relative z-10 w-full animate-pop rounded-t-2xl border border-line-strong bg-elevated shadow-pop sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-line/70 px-5 py-4">
          <span
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
              meta.danger
                ? "bg-danger/12 text-danger ring-danger/20"
                : "bg-gold/12 text-gold ring-gold/20",
            )}
          >
            <Icon className="size-4.5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="gym-action-title" className="text-[15px] font-semibold text-ink">
              {meta.title}
            </h2>
            <p className="mt-0.5 truncate text-[11.5px] text-faint">
              {gym.name} · <span className="font-mono">{gym.id}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={submitting}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-card-hover hover:text-ink disabled:opacity-40"
            aria-label="Close"
          >
            <X className="size-4" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-[12px] leading-relaxed text-subtle">{meta.description}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-line/70 bg-card/50 px-3 py-2 text-[11.5px]">
            <span className="text-faint">
              Current plan: <span className="text-ink">{currentPlanName}</span>
            </span>
            {subscription?.expiresAt && (
              <span className="text-faint">
                Expiry:{" "}
                <span className="text-ink">{formatPlatformDate(subscription.expiresAt)}</span>
              </span>
            )}
            {subscription && (
              <span className="text-faint">
                {subscription.entitled ? "Access on" : "Access blocked"}
              </span>
            )}
          </div>

          {mode === "plan" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="plan-select">Plan</Label>
                {planChoices.length === 0 ? (
                  <p className="rounded-lg border border-warning/30 bg-warning/8 px-3 py-2 text-[12px] text-warning">
                    No plans exist yet. Seed or create a plan on the legacy admin
                    billing API first.
                  </p>
                ) : (
                  <Select
                    id="plan-select"
                    value={planId}
                    onChange={(event) => setPlanId(event.target.value)}
                  >
                    {planChoices.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} — {formatPaise(plan.pricePaise)} /{" "}
                        {plan.durationMonths} mo{plan.isActive ? "" : " (inactive)"}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-expiry">Custom expiry (optional)</Label>
                <Input
                  id="plan-expiry"
                  type="date"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                />
                <p className="text-[11px] text-faint">
                  Leave blank to use the plan&apos;s duration from today.
                </p>
              </div>
            </>
          )}

          {mode === "extend" && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="extend-days">Additional days</Label>
                  <Input
                    id="extend-days"
                    type="number"
                    min={1}
                    max={3650}
                    value={days}
                    onChange={(event) => setDays(event.target.value)}
                    disabled={Boolean(expiresAt)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="extend-expiry">Or set expiry</Label>
                  <Input
                    id="extend-expiry"
                    type="date"
                    value={expiresAt}
                    onChange={(event) => setExpiresAt(event.target.value)}
                  />
                </div>
              </div>
              <p className="text-[11px] text-faint">
                An explicit expiry replaces the day count. Trial extensions move the
                trial end date instead of the paid period.
              </p>
            </>
          )}

          {mode === "trial" && (
            <div className="space-y-1.5">
              <Label htmlFor="trial-days">Trial length (days)</Label>
              <Input
                id="trial-days"
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(event) => setDays(event.target.value)}
              />
              <p className="text-[11px] text-faint">
                {effectiveStatus === "TRIALING"
                  ? "The new days are added to the current trial end date."
                  : "The trial starts now. One TrialRecord is written for the audit trail."}
              </p>
            </div>
          )}

          {mode === "end-trial" && (
            <div className="flex items-start gap-2 rounded-lg border border-danger/25 bg-danger/8 px-3 py-2.5">
              <Ban className="mt-0.5 size-3.5 shrink-0 text-danger" strokeWidth={2} aria-hidden />
              <p className="text-[11.5px] leading-relaxed text-subtle">
                This ends the trial immediately. The gym owner will lose access until a
                paid plan is assigned.
              </p>
            </div>
          )}

          {mode === "suspend" && (
            <div className="flex items-start gap-2 rounded-lg border border-danger/25 bg-danger/8 px-3 py-2.5">
              <Ban className="mt-0.5 size-3.5 shrink-0 text-danger" strokeWidth={2} aria-hidden />
              <p className="text-[11.5px] leading-relaxed text-subtle">
                Suspension blocks all gym endpoints immediately. Billing dates are
                preserved and the gym can be reactivated later.
              </p>
            </div>
          )}

          {mode === "activate" && (
            <>
              {needsExpiry && (
                <div className="space-y-1.5">
                  <Label htmlFor="activate-expiry">
                    New expiry <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="activate-expiry"
                    type="date"
                    value={expiresAt}
                    onChange={(event) => setExpiresAt(event.target.value)}
                  />
                  <p className="text-[11px] text-faint">
                    The paid period already ended, so activation needs a new end date.
                  </p>
                </div>
              )}
              {!needsExpiry && (
                <div className="flex items-start gap-2 rounded-lg border border-success/25 bg-success/8 px-3 py-2.5">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" strokeWidth={2} aria-hidden />
                  <p className="text-[11.5px] leading-relaxed text-subtle">
                    The paid period is still active. Activation can resume access
                    without changing the expiry.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="action-reason">
              Reason <span className="text-danger">*</span>
            </Label>
            <Textarea
              id="action-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Owner requested an upgrade after paying offline, ticket #1042"
              maxLength={500}
              rows={3}
            />
            <p className="text-[11px] text-faint">
              Stored with your account and role in the subscription audit log.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger/8 px-3 py-2 text-[12px] leading-relaxed text-danger">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-line/70 px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="md" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => void submit()}
            disabled={submitting || (mode === "plan" && planChoices.length === 0)}
            className={
              meta.danger
                ? "border-danger/40 bg-danger! bg-none! text-white! hover:brightness-110"
                : undefined
            }
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
            ) : (
              <Icon className="size-4" strokeWidth={2} aria-hidden />
            )}
            {meta.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
