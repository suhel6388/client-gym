"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { MixSlice } from "@/lib/dashboard-view";
import { formatNumber, formatPercent } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";

export function MembershipDonutChart({ data }: { data: MixSlice[] }) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-[340px] items-center justify-center text-center text-sm text-faint">
        No active memberships yet.
      </div>
    );
  }

  return (
    <div>
      <div className="relative mx-auto mt-2 h-[240px] w-full max-w-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="98%"
              paddingAngle={2.5}
              cornerRadius={5}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              animationDuration={800}
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              content={
                <ChartTooltip formatter={(value) => formatNumber(Math.round(value))} />
              }
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Centre label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[32px] leading-none font-bold tracking-tight tabular-nums text-ink">
            {formatNumber(total)}
          </span>
          <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-faint">
            Members
          </span>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {data.map((slice) => {
          const share = (slice.value / total) * 100;
          return (
            <li key={slice.name} className="flex items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: slice.color }}
                aria-hidden
              />
              <span className="flex-1 truncate text-[13px] text-subtle">
                {slice.name}
              </span>
              <span className="text-[13px] font-semibold tabular-nums text-ink">
                {formatNumber(slice.value)}
              </span>
              <span className="w-10 text-right text-[11px] tabular-nums text-faint">
                {formatPercent(share)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
