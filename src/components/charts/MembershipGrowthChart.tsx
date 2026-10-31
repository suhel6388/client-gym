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
import type { GrowthPoint } from "@/lib/dashboard-view";
import { formatNumber } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";

export function MembershipGrowthChart({ data }: { data: GrowthPoint[] }) {
  return (
    <div className="h-[220px] w-full sm:h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 6, bottom: 0, left: 4 }}
          barGap={4}
          barCategoryGap="30%"
        >
          <defs>
            <linearGradient id="barGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-gold-soft)" />
              <stop offset="60%" stopColor="var(--color-gold)" />
              <stop offset="100%" stopColor="var(--color-gold-deep)" />
            </linearGradient>
            <linearGradient id="barMuted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-line-strong)" />
              <stop offset="100%" stopColor="var(--color-line-soft)" />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="var(--color-line)"
            strokeOpacity={0.55}
            strokeDasharray="3 6"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-faint)", fontSize: 11 }}
            dy={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-faint)", fontSize: 11 }}
            width={40}
            tickFormatter={(value: number) => formatNumber(value)}
          />

          <Tooltip
            content={<ChartTooltip formatter={formatNumber} />}
            cursor={{ fill: "var(--color-ink)", fillOpacity: 0.05 }}
          />

          <Bar
            dataKey="joined"
            name="Joined"
            fill="url(#barGold)"
            radius={[5, 5, 0, 0]}
            maxBarSize={20}
            animationDuration={700}
          />
          <Bar
            dataKey="left"
            name="Left"
            fill="url(#barMuted)"
            radius={[5, 5, 0, 0]}
            maxBarSize={20}
            animationDuration={700}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}