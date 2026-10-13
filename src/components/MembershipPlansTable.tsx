"use client";

import { CalendarPlus, Pencil, Power } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { paiseToAmount, type PlanDto } from "@/lib/members-api";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { ActionMenu } from "./ActionMenu";

function durationLabel(months: number): string {
  if (months <= 0) return "—";
  if (months % 12 === 0) return `${months} mo · ${months / 12} yr`;
  return `${months} mo`;
}

type MembershipPlansTableProps = {
  plans: PlanDto[];
  activeCountByPlan: Map<string, number>;
  onEdit: (plan: PlanDto) => void;
  onAssign: (plan: PlanDto) => void;
  onDeactivate: (plan: PlanDto) => void;
  onReactivate: (plan: PlanDto) => void;
};

export function MembershipPlansTable({
  plans,
  activeCountByPlan,
  onEdit,
  onAssign,
  onDeactivate,
  onReactivate,
}: MembershipPlansTableProps) {
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-line/80">
      <table className="w-full min-w-[720px] divide-y divide-line/60">
        <thead>
          <tr className="bg-card-hover/40">
            {["Plan", "Duration", "Price", "Per month", "Assigned", "Status"].map((label) => (
              <th
                key={label}
                className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint"
              >
                {label}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/40 bg-card/60">
          {plans.map((plan) => (
            <tr key={plan.id} className="transition-colors hover:bg-card-hover/60">
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-ink">{plan.name}</p>
              </td>
              <td className="px-4 py-3 text-xs text-subtle">
                {durationLabel(plan.durationMonths)}
              </td>
              <td className="px-4 py-3 text-sm font-semibold tabular-nums text-gold">
                {formatCurrency(paiseToAmount(plan.pricePaise))}
              </td>
              <td className="px-4 py-3 text-xs tabular-nums text-subtle">
                {formatCurrency(
                  paiseToAmount(Math.round(plan.pricePaise / Math.max(1, plan.durationMonths))),
                )}
              </td>
              <td className="px-4 py-3 text-xs tabular-nums text-subtle">
                {activeCountByPlan.get(plan.id) ?? 0}
              </td>
              <td className="px-4 py-3">
                <Badge tone={plan.isActive ? "success" : "muted"} dot>
                  {plan.isActive ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onAssign(plan)}
                    aria-label={`Assign ${plan.name}`}
                  >
                    <CalendarPlus className="size-3.5" strokeWidth={1.75} aria-hidden />
                    Assign
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(plan)}
                    aria-label={`Edit ${plan.name}`}
                  >
                    <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                  </Button>
                  <ActionMenu
                    label={`${plan.name} options`}
                    items={[
                      { label: "Edit plan", icon: Pencil, onSelect: () => onEdit(plan) },
                      plan.isActive
                        ? {
                            label: "Deactivate",
                            icon: Power,
                            danger: true,
                            onSelect: () => onDeactivate(plan),
                          }
                        : {
                            label: "Reactivate",
                            icon: Power,
                            onSelect: () => onReactivate(plan),
                          },
                    ]}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
