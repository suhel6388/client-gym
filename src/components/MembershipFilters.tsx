"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  ExpiryFilter,
  PaymentStatus,
  SubscriptionStatus,
} from "@/lib/membership-view";
import type { PlanDto } from "@/lib/members-api";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";

export const MEMBERSHIP_STATUS_OPTIONS: ("All" | SubscriptionStatus)[] = [
  "All",
  "Active",
  "Expiring",
  "Expired",
  "Frozen",
  "Cancelled",
];

export const PAYMENT_STATUS_OPTIONS: ("All" | PaymentStatus)[] = [
  "All",
  "Paid",
  "Partial",
  "Due",
];

export const EXPIRY_OPTIONS: { value: ExpiryFilter; label: string }[] = [
  { value: "All", label: "Any expiry" },
  { value: "Today", label: "Expiring today" },
  { value: "7", label: "Expires in 7 days" },
  { value: "30", label: "Expires in 30 days" },
  { value: "Expired", label: "Expired" },
];

type MembershipFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  planFilter: string;
  planOptions: PlanDto[];
  onPlanFilterChange: (value: string) => void;
  statusFilter: "All" | SubscriptionStatus;
  onStatusFilterChange: (value: "All" | SubscriptionStatus) => void;
  paymentFilter: "All" | PaymentStatus;
  onPaymentFilterChange: (value: "All" | PaymentStatus) => void;
  expiryFilter: ExpiryFilter;
  onExpiryFilterChange: (value: ExpiryFilter) => void;
  filtersActive: boolean;
  onClearFilters: () => void;
};

export function MembershipFilters({
  query,
  onQueryChange,
  planFilter,
  planOptions,
  onPlanFilterChange,
  statusFilter,
  onStatusFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  expiryFilter,
  onExpiryFilterChange,
  filtersActive,
  onClearFilters,
}: MembershipFiltersProps) {
  return (
    <div className="mt-5 flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative sm:col-span-2 xl:col-span-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search member, code, phone, plan…"
            aria-label="Search memberships"
            className="h-9 w-full rounded-lg border border-line bg-card pr-3 pl-9 text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-gold/50"
          />
        </div>

        <Select
          value={planFilter}
          onChange={(event) => onPlanFilterChange(event.target.value)}
          aria-label="Filter by plan"
        >
          <option value="All">All plans</option>
          {planOptions.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </Select>

        <Select
          value={paymentFilter}
          onChange={(event) => onPaymentFilterChange(event.target.value as "All" | PaymentStatus)}
          aria-label="Filter by payment status"
        >
          {PAYMENT_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "All" ? "Any payment" : option}
            </option>
          ))}
        </Select>

        <Select
          value={expiryFilter}
          onChange={(event) => onExpiryFilterChange(event.target.value as ExpiryFilter)}
          aria-label="Filter by expiry"
        >
          {EXPIRY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {MEMBERSHIP_STATUS_OPTIONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onStatusFilterChange(item)}
            aria-pressed={statusFilter === item}
            className={cn(
              "h-8 rounded-lg px-3 text-xs font-medium transition-colors",
              statusFilter === item
                ? "gold-surface text-[#1A1503] shadow-gold"
                : "border border-line bg-card text-subtle hover:bg-card-hover hover:text-ink",
            )}
          >
            {item}
          </button>
        ))}
        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 px-3 text-xs text-gold hover:bg-gold/10"
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
