"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatNumber, formatPercent } from "@/lib/format";
import { CATEGORY_COLORS } from "@/lib/expenses-view";
import type { PlanMixSlice } from "@/lib/reports-view";
import { ChartTooltip } from "./ChartTooltip";

/** Count-based donut of the active-membership plan mix, with legend. */
export function PlanMixDonut({ slices }: { slices: PlanMixSlice[] }) {
  const data = slices.map((slice, index) => ({
    name: slice.plan,
    value: slice.count,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div>
      <div className="relative mx-auto mt-2 h-[230px] w-full max-w-[300px]">
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
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              content={
                <ChartTooltip formatter={(value) => formatNumber(Math.round(value))} />
              }
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] leading-none font-bold tracking-tight tabular-nums text-ink">
            {formatNumber(total)}
          </span>
          <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-faint">
            Active plans
          </span>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {slices.map((slice, index) => {
          const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
          return (
            <li key={slice.plan} className="flex items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <span className="flex-1 truncate text-[13px] text-subtle">
                {slice.plan}
              </span>
              <span className="text-[13px] font-semibold tabular-nums text-ink">
                {formatNumber(slice.count)}
              </span>
              <span className="w-11 text-right text-[11px] tabular-nums text-faint">
                {formatPercent(slice.share)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
