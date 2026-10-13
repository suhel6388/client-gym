"use client";

import { Search } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

type ExpenseFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  categoryFilter: string;
  categoryOptions: string[];
  onCategoryFilterChange: (value: string) => void;
  minAmount: string;
  onMinAmountChange: (value: string) => void;
  maxAmount: string;
  onMaxAmountChange: (value: string) => void;
  filtersActive: boolean;
  onClearFilters: () => void;
};

export function ExpenseFilters({
  query,
  onQueryChange,
  categoryFilter,
  categoryOptions,
  onCategoryFilterChange,
  minAmount,
  onMinAmountChange,
  maxAmount,
  onMaxAmountChange,
  filtersActive,
  onClearFilters,
}: ExpenseFiltersProps) {
  return (
    <div className="mt-5 flex flex-col gap-3">
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
            placeholder="Search title or notes…"
            aria-label="Search expenses"
            className="h-9 w-full rounded-lg border border-line bg-card pr-3 pl-9 text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-gold/50"
          />
        </div>

        <Select
          value={categoryFilter}
          onChange={(event) => onCategoryFilterChange(event.target.value)}
          aria-label="Filter by category"
        >
          <option value="All">All categories</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>

        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-faint">
            ₹
          </span>
          <Input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className="pl-7"
            value={minAmount}
            onChange={(event) => onMinAmountChange(event.target.value)}
            placeholder="Min amount"
            aria-label="Minimum amount"
          />
        </div>

        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-faint">
            ₹
          </span>
          <Input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className="pl-7"
            value={maxAmount}
            onChange={(event) => onMaxAmountChange(event.target.value)}
            placeholder="Max amount"
            aria-label="Maximum amount"
          />
        </div>
      </div>

      {filtersActive && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 px-3 text-xs text-gold hover:bg-gold/10"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
