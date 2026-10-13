"use client";

import { Check, Crown, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { paiseToAmount, type PlanDto } from "@/lib/members-api";
import {
  billingIntervalLabel,
  durationLabel,
  monthlyEquivalentPaise,
  type PlanAdoption,
} from "@/lib/plans-view";

export type PlanComparisonTableProps = {
  plans: PlanDto[];
  adoption: Map<string, PlanAdoption>;
  mostPopularPlanId: string | null;
};

type ComparisonRow = {
  label: string;
  render: (plan: PlanDto) => ReactNode;
};

export function PlanComparisonTable({
  plans,
  adoption,
  mostPopularPlanId,
}: PlanComparisonTableProps) {
  const rows: ComparisonRow[] = [
    {
      label: "Full-term price",
      render: (plan) => (
        <span className="font-semibold tabular-nums text-gold">
          {formatCurrency(paiseToAmount(plan.pricePaise))}
        </span>
      ),
    },
    {
      label: "Billing cadence",
      render: (plan) => billingIntervalLabel(plan.durationMonths),
    },
    {
      label: "Duration",
      render: (plan) => durationLabel(plan.durationMonths),
    },
    {
      label: "Price per month",
      render: (plan) => (
        <span className="tabular-nums">
          {formatCurrency(paiseToAmount(monthlyEquivalentPaise(plan)))}
        </span>
      ),
    },
    {
      label: "Active members",
      render: (plan) => (
        <span className="tabular-nums">{adoption.get(plan.id)?.active ?? 0}</span>
      ),
    },
    {
      label: "Monthly revenue",
      render: (plan) => (
        <span className="tabular-nums">
          {formatCurrency(paiseToAmount(adoption.get(plan.id)?.mrrPaise ?? 0))}
        </span>
      ),
    },
    {
      label: "Status",
      render: (plan) =>
        plan.isActive ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-success">
            <Check className="size-4" strokeWidth={2.25} aria-hidden />
            <span className="sr-only">Included: </span>Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-faint">
            <X className="size-4" strokeWidth={2} aria-hidden />
            <span className="sr-only">Not available: </span>Inactive
          </span>
        ),
    },
    {
      label: "Created",
      render: (plan) => formatShortDate(plan.createdAt.slice(0, 10)),
    },
  ];

  return (
    <div>
      <div className="mt-5 overflow-x-auto rounded-xl border border-line/80">
        <table className="w-full min-w-[640px] divide-y divide-line/60">
          <thead>
            <tr className="bg-card-hover/40">
              <th
                scope="col"
                className="w-44 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint"
              >
                Feature
              </th>
              {plans.map((plan) => (
                <th key={plan.id} scope="col" className="min-w-36 px-4 py-3 text-left">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                    <span className="truncate">{plan.name}</span>
                    {plan.id === mostPopularPlanId && (
                      <Crown
                        className="size-3.5 shrink-0 text-gold"
                        strokeWidth={2}
                        aria-label="Most popular plan"
                      />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40 bg-card/60">
            {rows.map((row) => (
              <tr key={row.label} className="transition-colors hover:bg-card-hover/60">
                <th
                  scope="row"
                  className="px-4 py-3 text-left text-xs font-medium text-faint"
                >
                  {row.label}
                </th>
                {plans.map((plan) => (
                  <td
                    key={plan.id}
                    className={cn(
                      "px-4 py-3 text-[13px] text-subtle",
                      plan.id === mostPopularPlanId && "bg-gold/[0.04]",
                    )}
                  >
                    {row.render(plan)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        Plan records store name, duration, price and status. Feature lists and usage
        limits aren&apos;t part of the plan record, so this comparison shows stored
        values only — nothing is assumed or marked unavailable.
      </p>
    </div>
  );
}
