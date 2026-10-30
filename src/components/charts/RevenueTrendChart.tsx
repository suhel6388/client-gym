"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
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

/** Gold area chart of collected revenue over the selected window. */
export function RevenueTrendChart({
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
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="revenueGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-gold)" stopOpacity={0.32} />
              <stop offset="55%" stopColor="var(--color-gold)" stopOpacity={0.08} />
              <stop offset="100%" stopColor="var(--color-gold)" stopOpacity={0} />
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
            cursor={{ stroke: "var(--color-line-strong)", strokeWidth: 1 }}
          />

          <Area
            type="monotone"
            dataKey="amount"
            name={`${SERIES_NAME[granularity]} collections`}
            stroke="var(--color-gold)"
            strokeWidth={2.25}
            fill="url(#revenueGold)"
            dot={false}
            activeDot={{
              r: 5,
              fill: "var(--color-gold-bright)",
              stroke: "var(--color-canvas)",
              strokeWidth: 2,
            }}
            animationDuration={700}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
