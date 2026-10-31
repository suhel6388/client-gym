"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrencyInr, formatCurrencyInr } from "@/lib/format";
import type { TrendGranularity, TrendPoint } from "@/lib/expenses-view";
import { ChartTooltip } from "./ChartTooltip";

const SERIES_NAME: Record<TrendGranularity, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
};

/** Gold bar chart of expenses over the selected window. */
export function ExpenseTrendChart({
  points,
  granularity,
}: {
  points: TrendPoint[];
  granularity: TrendGranularity;
}) {
  const data = points.map((point) => ({
    label: point.label,
    amount: point.totalPaise / 100,
    count: point.count,
  }));

  return (
    <div className="h-[230px] w-full sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 6, bottom: 0, left: 4 }}
          barCategoryGap="26%"
        >
          <defs>
            <linearGradient id="expenseGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-gold-soft)" />
              <stop offset="60%" stopColor="var(--color-gold)" />
              <stop offset="100%" stopColor="var(--color-gold-deep)" />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="var(--color-line)"
            strokeOpacity={0.55}
            strokeDasharray="3 6"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-faint)", fontSize: 11 }}
            dy={8}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-faint)", fontSize: 11 }}
            width={62}
            tickFormatter={(value: number) => formatCompactCurrencyInr(value)}
          />

          <Tooltip
            content={<ChartTooltip formatter={formatCurrencyInr} />}
            cursor={{ fill: "var(--color-ink)", fillOpacity: 0.05 }}
          />

          <Bar
            dataKey="amount"
            name={SERIES_NAME[granularity]}
            fill="url(#expenseGold)"
            radius={[5, 5, 0, 0]}
            maxBarSize={26}
            animationDuration={700}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
