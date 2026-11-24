"use client";

import { Check, Sparkles } from "lucide-react";
import { type BillingPlan } from "@/lib/api/billing";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type PlanCardProps = {
  plan: BillingPlan;
  isCurrent?: boolean;
  isSelected?: boolean;
  onSelect: (plan: BillingPlan) => void;
  loading?: boolean;
};

export function PlanCard({ plan, isCurrent = false, isSelected = false, onSelect, loading = false }: PlanCardProps) {
  const isPopular = plan.code === "PRO" || plan.slug === "pro";
  const priceRupees = Math.round(plan.pricePaise / 100);

  return (
    <div
      onClick={() => !isCurrent && onSelect(plan)}
      className={cn(
        "relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-200 cursor-pointer",
        isSelected
          ? "border-amber-400 ring-2 ring-amber-500/50 bg-gradient-to-b from-amber-950/30 via-zinc-900 to-zinc-950 shadow-2xl shadow-amber-500/20"
          : isPopular
            ? "border-amber-500/50 bg-gradient-to-b from-amber-950/20 via-zinc-900 to-zinc-950 shadow-xl shadow-amber-500/10 hover:border-amber-500/80"
            : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700",
      )}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold uppercase tracking-wider text-[10px] px-3 py-0.5 shadow-md flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Most Popular
          </Badge>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
          {isCurrent && (
            <Badge tone="success" className="border border-emerald-500/40 text-emerald-400 text-xs">
              Current Plan
            </Badge>
          )}
        </div>

        {plan.description && (
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 min-h-[40px] leading-relaxed">
            {plan.description}
          </p>
        )}

        <div className="mt-6 flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            ₹{priceRupees.toLocaleString("en-IN")}
          </span>
          <span className="text-xs sm:text-sm text-zinc-400">
            /{plan.durationMonths === 1 ? "month" : `${plan.durationMonths} months`}
          </span>
        </div>

        <div className="mt-6 border-t border-zinc-800/80 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            What&apos;s included:
          </p>
          <ul className="space-y-2.5">
            {plan.features?.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300">
                <Check className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 pt-4">
        <Button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(plan);
          }}
          disabled={loading || isCurrent}
          variant={isSelected || isPopular ? "primary" : "secondary"}
          className={cn(
            "w-full py-2.5 font-semibold text-sm rounded-xl transition-all",
            isSelected
              ? "bg-amber-400 text-black shadow-lg shadow-amber-500/30 font-bold"
              : isPopular
                ? "bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                : "bg-zinc-800 text-white hover:bg-zinc-700",
            isCurrent && "opacity-50 cursor-not-allowed",
          )}
        >
          {isCurrent ? "Current Plan" : isSelected ? "Selected Plan" : "Choose " + plan.name}
        </Button>
      </div>
    </div>
  );
}
