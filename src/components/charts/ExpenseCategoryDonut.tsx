"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  formatCompactCurrencyInr,
  formatCurrencyInr,
  formatPercent,
} from "@/lib/format";
import { CATEGORY_COLORS, type CategorySlice } from "@/lib/expenses-view";
import { categoryIcon } from "../ExpenseCategoryBadge";
import { ChartTooltip } from "./ChartTooltip";

/** Donut of expense totals per category with an on-theme legend. */
export function ExpenseCategoryDonut({ slices }: { slices: CategorySlice[] }) {
  const data = slices.map((slice, index) => ({
    name: slice.category,
    value: slice.totalPaise / 100,
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
            <Tooltip content={<ChartTooltip formatter={formatCurrencyInr} />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] leading-none font-bold tracking-tight tabular-nums text-ink">
            {formatCompactCurrencyInr(total)}
          </span>
          <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-faint">
            Total spend
          </span>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {slices.map((slice, index) => {
          const Icon = categoryIcon(slice.category);
          const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
          return (
            <li key={slice.category} className="flex items-center gap-2.5">
              <span
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${color}1f`, color }}
              >
                <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="flex-1 truncate text-[13px] text-subtle">
                {slice.category}
              </span>
              <span className="text-[13px] font-semibold tabular-nums text-ink">
                {formatCurrencyInr(slice.totalPaise / 100)}
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
