"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { revenueSeries } from "@/lib/data";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";

export function RevenueChart() {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={revenueSeries}
          margin={{ top: 8, right: 6, bottom: 0, left: 4 }}
        >
          <defs>
            <linearGradient id="revGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8B84D" stopOpacity={0.32} />
              <stop offset="55%" stopColor="#E8B84D" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#E8B84D" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="#303034"
            strokeOpacity={0.55}
            strokeDasharray="3 6"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#71717A", fontSize: 11 }}
            dy={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#71717A", fontSize: 11 }}
            width={56}
            tickFormatter={(value: number) => formatCompactCurrency(value)}
          />

          <Tooltip
            content={<ChartTooltip formatter={formatCurrency} />}
            cursor={{ stroke: "#3F3F46", strokeWidth: 1 }}
          />

          <Area
            type="monotone"
            dataKey="revenue"
            name="This year"
            stroke="#E8B84D"
            strokeWidth={2.25}
            fill="url(#revGold)"
            dot={{
              r: 2.5,
              fill: "#E8B84D",
              stroke: "#0B0B0D",
              strokeWidth: 1.5,
            }}
            activeDot={{
              r: 5,
              fill: "#FFC857",
              stroke: "#0B0B0D",
              strokeWidth: 2,
            }}
            animationDuration={700}
          />
          <Line
            type="monotone"
            dataKey="previous"
            name="Last year"
            stroke="#4B4B52"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            strokeOpacity={0.85}
            dot={false}
            activeDot={false}
            animationDuration={700}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}