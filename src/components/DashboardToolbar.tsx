"use client";

import { Calendar, Download, UserPlus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { openCreateMember } from "@/lib/events";
import { Button } from "./ui/Button";

const RANGES = ["7D", "30D", "90D", "12M"] as const;
type Range = (typeof RANGES)[number];

export function DashboardToolbar() {
  const [range, setRange] = useState<Range>("30D");

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Date range selector */}
      <div
        role="group"
        aria-label="Date range"
        className="flex h-9 items-center gap-0.5 rounded-lg border border-line bg-card p-1"
      >
        <Calendar className="mx-1.5 size-3.5 shrink-0 text-faint" strokeWidth={1.75} aria-hidden />
        {RANGES.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={range === item}
            onClick={() => setRange(item)}
            className={cn(
              "h-7 rounded-md px-2.5 text-xs font-medium transition-colors duration-150",
              range === item
                ? "gold-surface font-semibold text-[#1A1503] shadow-gold"
                : "text-subtle hover:text-ink",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <Button variant="secondary" size="md">
        <Download className="size-4" strokeWidth={1.75} aria-hidden />
        Export
      </Button>

      <Button
        variant="primary"
        size="md"
        onClick={openCreateMember}
      >
        <UserPlus className="size-4" strokeWidth={2} aria-hidden />
        Add member
      </Button>
    </div>
  );
}