"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import type { PlanDto } from "@/lib/members-api";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";

export type AttendanceStatusFilter =
  | "All"
  | "Present"
  | "Checked In"
  | "Checked Out"
  | "Absent";

export type AttendanceMethodFilter = "All" | "MANUAL" | "FINGERPRINT";

export const ATTENDANCE_STATUS_OPTIONS: AttendanceStatusFilter[] = [
  "All",
  "Present",
  "Checked In",
  "Checked Out",
  "Absent",
];

export const ATTENDANCE_METHOD_OPTIONS: {
  value: AttendanceMethodFilter;
  label: string;
}[] = [
  { value: "All", label: "Any method" },
  { value: "MANUAL", label: "Manual" },
  { value: "FINGERPRINT", label: "Fingerprint" },
];

type AttendanceFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: AttendanceStatusFilter;
  onStatusFilterChange: (value: AttendanceStatusFilter) => void;
  methodFilter: AttendanceMethodFilter;
  onMethodFilterChange: (value: AttendanceMethodFilter) => void;
  planFilter: string;
  planOptions: PlanDto[];
  onPlanFilterChange: (value: string) => void;
  filtersActive: boolean;
  onClearFilters: () => void;
};

export function AttendanceFilters({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  methodFilter,
  onMethodFilterChange,
  planFilter,
  planOptions,
  onPlanFilterChange,
  filtersActive,
  onClearFilters,
}: AttendanceFiltersProps) {
  return (
    <div className="mt-5 flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search member, code or phone…"
            aria-label="Search attendance records"
            className="h-9 w-full rounded-lg border border-line bg-card pr-3 pl-9 text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-gold/50"
          />
        </div>

        <Select
          value={methodFilter}
          onChange={(event) =>
            onMethodFilterChange(event.target.value as AttendanceMethodFilter)
          }
          aria-label="Filter by attendance method"
        >
          {ATTENDANCE_METHOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

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
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ATTENDANCE_STATUS_OPTIONS.map((item) => (
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
