import {
  monthlyValuePaise,
  toSubscriptionStatus,
} from "./membership-view";
import type { MembershipWithRelationsDto, PlanDto } from "./members-api";

/** Human duration, e.g. "1 month" or "12 months · 1 yr". */
export function durationLabel(months: number): string {
  if (!Number.isFinite(months) || months <= 0) return "—";
  if (months % 12 === 0) {
    const years = months / 12;
    return `${months} months · ${years} yr`;
  }
  return `${months} month${months === 1 ? "" : "s"}`;
}

/**
 * Display-only billing cadence derived from the stored duration. The API
 * stores no billing interval, so this is a label — never a price
 * transformation and never a discount claim.
 */
export function billingIntervalLabel(months: number): string {
  switch (months) {
    case 1:
      return "Monthly";
    case 3:
      return "Quarterly";
    case 6:
      return "Half-yearly";
    case 12:
      return "Yearly";
    default:
      if (Number.isFinite(months) && months > 0 && months % 12 === 0) {
        return `Every ${months / 12} years`;
      }
      if (Number.isFinite(months) && months > 0) {
        return `${months}-month term`;
      }
      return "—";
  }
}

/** Normalizes a plan's full-term price to an equivalent monthly value, in paise. */
export function monthlyEquivalentPaise(
  plan: Pick<PlanDto, "pricePaise" | "durationMonths">,
): number {
  return Math.round(plan.pricePaise / Math.max(1, plan.durationMonths));
}

/** Subscriptions that still carry revenue value (active or expiring). */
export function isBillableSubscription(
  membership: MembershipWithRelationsDto,
): boolean {
  const status = toSubscriptionStatus(membership);
  return status === "Active" || status === "Expiring";
}

export type PlanAdoption = {
  /** Active + expiring subscriptions on this plan. */
  active: number;
  /** All recorded subscriptions on this plan, any status. */
  total: number;
  /** Monthly revenue contributed by this plan's billable subscriptions, paise. */
  mrrPaise: number;
};

export function adoptionByPlan(
  memberships: MembershipWithRelationsDto[],
): Map<string, PlanAdoption> {
  const map = new Map<string, PlanAdoption>();
  for (const membership of memberships) {
    const entry = map.get(membership.planId) ?? { active: 0, total: 0, mrrPaise: 0 };
    entry.total += 1;
    if (isBillableSubscription(membership)) {
      entry.active += 1;
      entry.mrrPaise += monthlyValuePaise(membership);
    }
    map.set(membership.planId, entry);
  }
  return map;
}

export type PlanPerformance = {
  totalPlans: number;
  activePlans: number;
  /** Billable (active + expiring) subscriptions across every plan. */
  activeSubscriptions: number;
  /** Monthly recurring revenue across every billable subscription, paise. */
  mrrPaise: number;
  /** Mean monthly-equivalent price across plans, paise. */
  avgMonthlyPaise: number;
  /**
   * Explicit data-driven "most popular" pick: the plan with the most active
   * subscriptions. `null` when nothing is subscribed. Ties resolve to the
   * cheaper plan (plans are pre-sorted by price).
   */
  mostPopularPlanId: string | null;
};

export function summarizePlans(
  plans: PlanDto[],
  memberships: MembershipWithRelationsDto[],
): PlanPerformance {
  let activeSubscriptions = 0;
  let mrrPaise = 0;
  const activeByPlan = new Map<string, number>();

  for (const membership of memberships) {
    if (!isBillableSubscription(membership)) continue;
    activeSubscriptions += 1;
    mrrPaise += monthlyValuePaise(membership);
    activeByPlan.set(
      membership.planId,
      (activeByPlan.get(membership.planId) ?? 0) + 1,
    );
  }

  let mostPopularPlanId: string | null = null;
  let best = 0;
  for (const plan of plans) {
    const count = activeByPlan.get(plan.id) ?? 0;
    if (count > best) {
      best = count;
      mostPopularPlanId = plan.id;
    }
  }

  const avgMonthlyPaise =
    plans.length > 0
      ? Math.round(
          plans.reduce((total, plan) => total + monthlyEquivalentPaise(plan), 0) /
            plans.length,
        )
      : 0;

  return {
    totalPlans: plans.length,
    activePlans: plans.filter((plan) => plan.isActive).length,
    activeSubscriptions,
    mrrPaise,
    avgMonthlyPaise,
    mostPopularPlanId,
  };
}
