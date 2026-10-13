"use client";

import {
  CalendarDays,
  CalendarPlus,
  Crown,
  Hash,
  Layers,
  Pencil,
  Power,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatLongDate } from "@/lib/format";
import { paiseToAmount, type PlanDto } from "@/lib/members-api";
import {
  billingIntervalLabel,
  durationLabel,
  monthlyEquivalentPaise,
} from "@/lib/plans-view";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

export type PlanDetailsDrawerProps = {
  plan: PlanDto | null;
  activeCount: number;
  totalCount: number;
  /** Monthly revenue from this plan's billable subscriptions, paise. */
  mrrPaise: number;
  /** Share of all active subscriptions held by this plan, 0–100. */
  sharePct: number;
  isMostPopular: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
};

export function PlanDetailsDrawer({
  plan,
  activeCount,
  totalCount,
  mrrPaise,
  sharePct,
  isMostPopular,
  open,
  onOpenChange,
  onAssign,
  onEdit,
  onDeactivate,
}: PlanDetailsDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onOpenChange]);

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
        aria-labelledby="plan-details-title"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line/60 px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <Layers className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <h2 id="plan-details-title" className="text-sm font-semibold text-ink">
              Plan details
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

        {plan && (
          <div className="scroll-thin flex-1 overflow-y-auto px-6 py-6">
            <div className="rounded-xl border border-gold/25 bg-gradient-to-b from-gold/[0.1] to-transparent p-5 text-center">
              <div className="flex items-center justify-center gap-2">
                <Badge tone={plan.isActive ? "success" : "muted"} dot>
                  {plan.isActive ? "Active" : "Inactive"}
                </Badge>
                {isMostPopular && (
                  <span className="gold-surface inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-[#1A1503]">
                    <Crown className="size-3" strokeWidth={2.25} aria-hidden />
                    Most Popular
                  </span>
                )}
              </div>
              <p className="mt-3 text-lg font-semibold text-ink">{plan.name}</p>
              <p className="mt-2 text-[34px] leading-none font-bold tracking-tight tabular-nums text-gold">
                {formatCurrency(paiseToAmount(plan.pricePaise))}
              </p>
              <p className="mt-2 text-xs text-faint">
                {billingIntervalLabel(plan.durationMonths)} · {durationLabel(plan.durationMonths)}
              </p>
            </div>

            <dl className="mt-5 divide-y divide-line/40 rounded-xl border border-line/60">
              <Field
                icon={Wallet}
                label="Price per month (equivalent)"
                value={formatCurrency(paiseToAmount(monthlyEquivalentPaise(plan)))}
              />
              <Field
                icon={Users}
                label="Subscriptions"
                value={`${activeCount} active · ${totalCount} total`}
              />
              <Field
                icon={Wallet}
                label="Monthly revenue from plan"
                value={formatCurrency(paiseToAmount(mrrPaise))}
              />
              <Field
                icon={CalendarDays}
                label="Created"
                value={formatLongDate(plan.createdAt.slice(0, 10))}
              />
              <Field
                icon={Hash}
                label="Plan ID"
                value={
                  <span className="font-mono text-[11px] break-all text-subtle">
                    {plan.id}
                  </span>
                }
              />
            </dl>

            <div className="mt-5 rounded-xl border border-line/60 px-4 py-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-faint">Share of active subscriptions</span>
                <span className="font-semibold tabular-nums text-ink">
                  {sharePct.toFixed(1)}%
                </span>
              </div>
              <div
                className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-card-hover"
                role="progressbar"
                aria-valuenow={Math.round(sharePct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${plan.name} share of active subscriptions`}
              >
                <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, sharePct)}%` }} />
              </div>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-faint">
              Deactivated plans stay on existing subscriptions but disappear from the
              active catalog and can&apos;t be assigned to new members.
            </p>
          </div>
        )}

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line/60 px-6 py-4 sm:flex-row sm:justify-end">
          {plan?.isActive && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onDeactivate}
              className="text-danger hover:bg-danger/10 hover:text-danger sm:mr-auto"
            >
              <Power className="size-4" strokeWidth={1.75} aria-hidden />
              Deactivate
            </Button>
          )}
          <Button type="button" variant="secondary" size="md" onClick={onEdit}>
            <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
            Edit
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!plan?.isActive}
            onClick={onAssign}
          >
            <CalendarPlus className="size-4" strokeWidth={2} aria-hidden />
            Assign plan
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
  icon: LucideIcon;
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
