"use client";

import { cn } from "@/lib/cn";

type Entry = {
  name?: string | number;
  value?: string | number | ReadonlyArray<string | number>;
  color?: string;
  dataKey?: unknown;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<Entry>;
  label?: string | number;
  formatter?: (value: number) => string;
};

/**
 * Shared custom tooltip for every Recharts chart. Dark surface, soft gold
 * hairline border, muted label header and monospace-ish tabular values.
 */
export function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-gold/25 bg-elevated/95 px-3.5 py-2.5 shadow-pop backdrop-blur-sm">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div
            key={`${String(entry.dataKey)}-${index}`}
            className="flex items-center justify-between gap-6 text-xs"
          >
            <span className="inline-flex items-center gap-1.5 text-subtle">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-ink">
              {formatter
                ? formatter(Number(entry.value ?? 0))
                : String(entry.value ?? "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Small inline legend used inside card headers — keeps charts clean. */
export function LegendChips({
  items,
  className,
}: {
  items: Array<{ label: string; color: string }>;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5 text-[11px] text-subtle">
          <span className="size-2 rounded-[3px]" style={{ backgroundColor: item.color }} aria-hidden />
          {item.label}
        </span>
      ))}
    </div>
  );
}