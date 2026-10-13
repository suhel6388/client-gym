"use client";

import { Search } from "lucide-react";
import { PAYMENT_MODE_OPTIONS } from "@/lib/member-form";
import type { PaymentModeDto } from "@/lib/members-api";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";

export type PaymentMethodFilter = "All" | PaymentModeDto;

type PaymentFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  methodFilter: PaymentMethodFilter;
  onMethodFilterChange: (value: PaymentMethodFilter) => void;
  statusFilter: string;
  statusOptions: string[];
  onStatusFilterChange: (value: string) => void;
  filtersActive: boolean;
  onClearFilters: () => void;
};

export function PaymentFilters({
  query,
  onQueryChange,
  methodFilter,
  onMethodFilterChange,
  statusFilter,
  statusOptions,
  onStatusFilterChange,
  filtersActive,
  onClearFilters,
}: PaymentFiltersProps) {
  return (
    <div className="mt-5 flex flex-col gap-2.5 lg:flex-row lg:items-center">
      <div className="relative lg:max-w-md lg:flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search receipt, member, code or reference…"
          aria-label="Search payments"
          className="h-9 w-full rounded-lg border border-line bg-card pr-3 pl-9 text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-gold/50"
        />
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:w-[420px]">
        <Select
          value={methodFilter}
          onChange={(event) =>
            onMethodFilterChange(event.target.value as PaymentMethodFilter)
          }
          aria-label="Filter by payment method"
        >
          <option value="All">All methods</option>
          {PAYMENT_MODE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
          aria-label="Filter by payment status"
        >
          <option value="All">Any status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
      </div>

      {filtersActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-8 shrink-0 px-3 text-xs text-gold hover:bg-gold/10 lg:ml-auto"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
