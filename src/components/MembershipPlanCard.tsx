"use client";

import { CalendarPlus, Pencil, Power, Users } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { paiseToAmount, type PlanDto } from "@/lib/members-api";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { ActionMenu } from "./ActionMenu";

function durationLabel(months: number): string {
  if (months <= 0) return "—";
  if (months % 12 === 0) {
    const years = months / 12;
    return `${months} months · ${years} yr`;
  }
  return `${months} month${months === 1 ? "" : "s"}`;
}

type MembershipPlanCardProps = {
  plan: PlanDto;
  /** Active subscriptions currently attached to this plan. */
  activeCount: number;
  onEdit: () => void;
  onAssign: () => void;
  onDeactivate: () => void;
  onReactivate?: () => void;
};

export function MembershipPlanCard({
  plan,
  activeCount,
  onEdit,
  onAssign,
  onDeactivate,
  onReactivate,
}: MembershipPlanCardProps) {
  const monthlyPaise = Math.round(plan.pricePaise / Math.max(1, plan.durationMonths));

  return (
    <div className="group flex flex-col rounded-xl border border-line bg-card-hover/20 p-4 transition-colors hover:border-line-strong hover:bg-card-hover/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{plan.name}</p>
          <p className="mt-0.5 text-[11px] text-faint">{durationLabel(plan.durationMonths)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge tone={plan.isActive ? "success" : "muted"} dot>
            {plan.isActive ? "Active" : "Inactive"}
          </Badge>
          <ActionMenu
            label={`${plan.name} options`}
            items={[
              { label: "Edit plan", icon: Pencil, onSelect: onEdit },
              plan.isActive
                ? { label: "Deactivate", icon: Power, danger: true, onSelect: onDeactivate }
                : {
                    label: "Reactivate",
                    icon: Power,
                    onSelect: onReactivate ?? onEdit,
                  },
            ]}
          />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[22px] leading-none font-bold tabular-nums text-gold">
            {formatCurrency(paiseToAmount(plan.pricePaise))}
          </p>
          <p className="mt-1 text-[11px] text-faint">
            {formatCurrency(paiseToAmount(monthlyPaise))} / month
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-subtle">
          <Users className="size-3.5 text-faint" strokeWidth={1.75} aria-hidden />
          {activeCount} active
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-line/60 pt-3">
        <Button variant="secondary" size="sm" className="flex-1" onClick={onAssign}>
          <CalendarPlus className="size-3.5" strokeWidth={1.75} aria-hidden />
          Assign
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
          Edit
        </Button>
      </div>
    </div>
  );
}
