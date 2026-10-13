"use client";

import {
  CalendarDays,
  CalendarPlus,
  Crown,
  Eye,
  Pencil,
  Power,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { paiseToAmount, type PlanDto } from "@/lib/members-api";
import {
  billingIntervalLabel,
  durationLabel,
  monthlyEquivalentPaise,
} from "@/lib/plans-view";
import { ActionMenu } from "./ActionMenu";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

export type PlanPricingCardProps = {
  plan: PlanDto;
  /** Active + expiring subscriptions on this plan. */
  activeCount: number;
  /** All recorded subscriptions on this plan. */
  totalCount: number;
  /** Data-driven highlight: most active subscriptions. */
  isMostPopular: boolean;
  onAssign: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
  onView: () => void;
};

export function PlanPricingCard({
  plan,
  activeCount,
  totalCount,
  isMostPopular,
  onAssign,
  onEdit,
  onDeactivate,
  onView,
}: PlanPricingCardProps) {
  const monthlyPaise = monthlyEquivalentPaise(plan);

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-card border bg-card p-5 shadow-card transition-all duration-200 hover:border-line-strong",
        isMostPopular
          ? "border-gold/45 hover:border-gold/60"
          : "border-line",
      )}
    >
      {isMostPopular && (
        <span className="gold-surface absolute -top-3 left-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold text-[#1A1503] shadow-gold">
          <Crown className="size-3" strokeWidth={2.25} aria-hidden />
          Most Popular
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-ink">{plan.name}</h3>
          <p className="mt-1 text-xs text-faint">
            {billingIntervalLabel(plan.durationMonths)} · {durationLabel(plan.durationMonths)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge tone={plan.isActive ? "success" : "muted"} dot>
            {plan.isActive ? "Active" : "Inactive"}
          </Badge>
          <ActionMenu
            label={`${plan.name} options`}
            items={[
              { label: "View details", icon: Eye, onSelect: onView },
              { label: "Edit plan", icon: Pencil, onSelect: onEdit },
              ...(plan.isActive
                ? [{ label: "Deactivate", icon: Power, danger: true, onSelect: onDeactivate }]
                : []),
            ]}
          />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[34px] leading-none font-bold tracking-tight tabular-nums text-ink">
          {formatCurrency(paiseToAmount(plan.pricePaise))}
        </p>
        <p className="mt-2 text-xs text-faint">
          <span className="font-semibold tabular-nums text-gold">
            {formatCurrency(paiseToAmount(monthlyPaise))}/mo
          </span>{" "}
          equivalent · one-time per term
        </p>
      </div>

      <dl className="mt-5 space-y-2.5 border-t border-line/60 pt-4 text-xs">
        <MetaRow icon={Users} label="Subscribed">
          <span className="tabular-nums">
            {activeCount} active
            <span className="text-faint"> · {totalCount} total</span>
          </span>
        </MetaRow>
        <MetaRow icon={CalendarDays} label="Created">
          {formatShortDate(plan.createdAt.slice(0, 10))}
        </MetaRow>
      </dl>

      <div className="mt-5 flex items-center gap-2 border-t border-line/60 pt-4">
        <Button variant="secondary" size="sm" className="flex-1" onClick={onAssign}>
          <CalendarPlus className="size-3.5" strokeWidth={1.75} aria-hidden />
          Assign plan
        </Button>
        <Button variant="ghost" size="sm" onClick={onView} aria-label={`View ${plan.name} details`}>
          <Eye className="size-3.5" strokeWidth={1.75} aria-hidden />
          Details
        </Button>
      </div>
    </article>
  );
}

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-1.5 text-faint">
        <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
        {label}
      </dt>
      <dd className="text-subtle">{children}</dd>
    </div>
  );
}
