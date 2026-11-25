"use client";

import { Check, Sparkles, Users, UserCog, Dumbbell, Clock } from "lucide-react";
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

function resolveDurationDays(plan: BillingPlan): number {
  if (plan.durationDays && plan.durationDays > 0) {
    return Math.floor(plan.durationDays);
  }
  if (plan.durationMonths && plan.durationMonths > 0) {
    if (plan.durationMonths === 12) return 365;
    if (plan.durationMonths % 12 === 0) {
      return Math.floor((plan.durationMonths / 12) * 365);
    }
    return Math.floor(plan.durationMonths * 30);
  }
  return 30;
}

function formatLimit(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined || value <= 0) {
    return `Unlimited ${unit}`;
  }
  return `${value.toLocaleString("en-IN")} ${unit}`;
}

export function PlanCard({
  plan,
  isCurrent = false,
  isSelected = false,
  onSelect,
  loading = false,
}: PlanCardProps) {
  const isPopular =
    plan.code === "PRO" ||
    plan.slug === "pro" ||
    plan.code === "HALF_YEARLY" ||
    plan.durationMonths === 6;
  const priceRupees = Math.round(plan.pricePaise / 100);
  const durationDays = resolveDurationDays(plan);
  const features = Array.isArray(plan.features) ? plan.features : [];

  return (
    <div
      onClick={() => onSelect(plan)}
      className={cn(
        "relative flex h-full flex-col justify-between rounded-[14px] border p-6 transition-all duration-200 cursor-pointer",
        isSelected
          ? "border-amber-400 ring-2 ring-amber-500/40 bg-gradient-to-b from-amber-500/[0.08] via-[#17171B] to-[#121215] shadow-2xl shadow-amber-500/15"
          : isPopular
            ? "border-amber-500/50 bg-gradient-to-b from-amber-500/[0.05] via-[#16161A] to-[#121215] shadow-xl shadow-amber-500/10 hover:border-amber-400/80"
            : "border-zinc-800 bg-[#141418] hover:border-amber-500/40 hover:bg-[#18181D]",
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold uppercase tracking-wider text-[10px] px-3 py-0.5 shadow-md flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Most Popular
          </Badge>
        </div>
      )}

      <div>
        {/* Plan Name & Badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
          {isCurrent && (
            <Badge className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[11px] shrink-0">
              Current Plan
            </Badge>
          )}
        </div>

        {plan.description && (
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 min-h-[40px] leading-relaxed">
            {plan.description}
          </p>
        )}

        {/* Price in INR & Duration */}
        <div className="mt-5 flex items-baseline justify-between gap-2 border-b border-zinc-800/80 pb-5">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              ₹{priceRupees.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-zinc-400">INR</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
            <Clock className="h-3 w-3 text-amber-400" />
            {durationDays} Days
          </span>
        </div>

        {/* Limits: Member, Staff, Trainer */}
        <div className="mt-5 space-y-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 text-xs">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="inline-flex items-center gap-2 text-zinc-400">
              <Users className="h-3.5 w-3.5 text-amber-400" /> Member Limit
            </span>
            <span className="font-semibold text-white">
              {formatLimit(plan.maxMembers, "Members")}
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-300">
            <span className="inline-flex items-center gap-2 text-zinc-400">
              <UserCog className="h-3.5 w-3.5 text-amber-400" /> Staff Limit
            </span>
            <span className="font-semibold text-white">
              {formatLimit(plan.maxStaff, "Staff")}
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-300">
            <span className="inline-flex items-center gap-2 text-zinc-400">
              <Dumbbell className="h-3.5 w-3.5 text-amber-400" /> Trainer Limit
            </span>
            <span className="font-semibold text-white">
              {formatLimit(plan.maxTrainers, "Trainers")}
            </span>
          </div>
        </div>

        {/* Included Features */}
        {features.length > 0 && (
          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
              Included Features
            </p>
            <ul className="space-y-2">
              {features.map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300"
                >
                  <Check className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Purchase / Select Button */}
      <div className="mt-7 pt-2">
        <Button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(plan);
          }}
          disabled={loading}
          className={cn(
            "w-full py-2.5 font-semibold text-sm rounded-xl transition-all",
            isSelected
              ? "bg-amber-400 text-black shadow-lg shadow-amber-500/25 font-bold hover:bg-amber-300"
              : isPopular
                ? "bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                : "border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-black",
          )}
        >
          {isSelected
            ? "✓ Plan Selected"
            : isCurrent
              ? "Renew / Extend Plan"
              : "Select Plan"}
        </Button>
      </div>
    </div>
  );
}
