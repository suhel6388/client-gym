"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  Legend,
} from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CalendarDays,
  Clock,
  Eye,
  Globe,
  Laptop,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getVisitorAnalytics,
  type DeviceType,
  type VisitorAnalyticsData,
  type VisitorPeriod,
} from "@/lib/visitor-tracker";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

const PERIOD_LABELS: Record<VisitorPeriod, string> = {
  daily: "Daily (Today)",
  weekly: "Weekly (Last 7d)",
  monthly: "Monthly (Last 30d)",
  yearly: "Yearly (12m)",
  custom: "Custom Range",
};

export function VisitorAnalyticsView() {
  const [period, setPeriod] = useState<VisitorPeriod>("weekly");
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split("T")[0];
  });
  const [customTo, setCustomTo] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const analytics: VisitorAnalyticsData = useMemo(() => {
    return getVisitorAnalytics(
      period,
      period === "custom" ? { from: customFrom, to: customTo } : undefined,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customFrom, customTo, refreshKey]);

  const { summary, chartData, topPages, deviceBreakdown, browserBreakdown, recentVisits } = analytics;

  const getDeviceIcon = (dev: DeviceType | string) => {
    const lower = dev.toLowerCase();
    if (lower.includes("mobile") || lower.includes("phone")) {
      return <Smartphone className="h-4 w-4 text-gold" />;
    }
    if (lower.includes("tablet") || lower.includes("ipad")) {
      return <Tablet className="h-4 w-4 text-sky-400" />;
    }
    return <Laptop className="h-4 w-4 text-emerald-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header & Period Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold ring-1 ring-gold/20">
              <Globe className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Site Visitor Analytics
            </h1>
          </div>
          <p className="mt-1 text-xs text-faint sm:text-sm">
            Real-time and historical website traffic. Visible strictly to Super Admin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="h-9 gap-1.5 border-line bg-card/60 text-xs text-faint hover:text-ink"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Custom Date Selector */}
      <div className="flex flex-col gap-3 rounded-xl border border-line/60 bg-card/40 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["daily", "weekly", "monthly", "yearly", "custom"] as VisitorPeriod[]).map((p) => {
            const active = period === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-gold text-canvas shadow-sm font-semibold"
                    : "text-faint hover:bg-white/5 hover:text-ink",
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            );
          })}
        </div>

        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t border-line/40 sm:border-t-0">
            <div className="flex items-center gap-1.5 text-xs text-faint">
              <Calendar className="h-3.5 w-3.5 text-gold" />
              <span>From:</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-md border border-line bg-canvas/80 px-2 py-1 text-xs text-ink focus:border-gold focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-faint">
              <span>To:</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-md border border-line bg-canvas/80 px-2 py-1 text-xs text-ink focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Visits */}
        <div className="rounded-xl border border-line/60 bg-card/60 p-4 transition-all hover:border-gold/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-faint">Total Visits (Page Views)</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/10 text-gold">
              <Eye className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-ink">
              {formatNumber(summary.totalVisits)}
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              +{summary.previousPeriodChangePct}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-faint">
            Total browser page loads during this {period} window
          </p>
        </div>

        {/* Unique Visitors */}
        <div className="rounded-xl border border-line/60 bg-card/60 p-4 transition-all hover:border-gold/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-faint">Unique Visitors</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-400/10 text-sky-400">
              <Users className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-ink">
              {formatNumber(summary.uniqueVisitors)}
            </span>
            <span className="text-xs text-faint">
              ({summary.totalVisits > 0 ? Math.round((summary.uniqueVisitors / summary.totalVisits) * 100) : 0}% unique)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-faint">
            Distinct visitor devices / clients tracked
          </p>
        </div>

        {/* Avg Daily Visits */}
        <div className="rounded-xl border border-line/60 bg-card/60 p-4 transition-all hover:border-gold/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-faint">Avg Daily Traffic</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
              <Activity className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-ink">
              {formatNumber(summary.avgDailyVisits)}
            </span>
            <span className="text-xs text-faint">views/day</span>
          </div>
          <p className="mt-1 text-[11px] text-faint">
            ~{summary.pagesPerVisit} pages viewed per session
          </p>
        </div>

        {/* Peak Traffic */}
        <div className="rounded-xl border border-line/60 bg-card/60 p-4 transition-all hover:border-gold/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-faint">Peak Traffic Window</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
              <Clock className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-ink truncate">
              {summary.peakTimeLabel}
            </span>
            <span className="text-xs text-gold font-medium">
              ({summary.peakVisitsCount} views)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-faint">
            Highest traffic volume recorded
          </p>
        </div>
      </div>

      {/* Main Traffic Trend Chart */}
      <div className="rounded-xl border border-line/60 bg-card/60 p-4 sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-ink sm:text-base">
              Visitor Traffic Volume
            </h2>
            <p className="text-xs text-faint">
              Visits and unique visitors over the selected {PERIOD_LABELS[period]}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-gold" />
              <span className="text-faint">Total Visits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
              <span className="text-faint">Unique Visitors</span>
            </div>
          </div>
        </div>

        <div className="h-[280px] w-full sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, bottom: 0, left: -10 }}
            >
              <defs>
                <linearGradient id="visGoldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                  <stop offset="65%" stopColor="#D4AF37" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="visSkyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.35} />
                  <stop offset="65%" stopColor="#38BDF8" stopOpacity={0.05} />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="var(--color-line)"
                strokeOpacity={0.4}
                strokeDasharray="3 4"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                dy={8}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                dx={-4}
                allowDecimals={false}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const visits = payload.find((p) => p.dataKey === "visits")?.value ?? 0;
                  const unique = payload.find((p) => p.dataKey === "uniqueVisitors")?.value ?? 0;
                  return (
                    <div className="rounded-lg border border-line bg-canvas/95 p-2.5 text-xs shadow-xl backdrop-blur-md">
                      <p className="font-semibold text-ink">{label}</p>
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-faint">
                            <span className="h-2 w-2 rounded-full bg-gold" />
                            Total Visits:
                          </span>
                          <span className="font-medium text-ink">{visits}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-faint">
                            <span className="h-2 w-2 rounded-full bg-sky-400" />
                            Unique Visitors:
                          </span>
                          <span className="font-medium text-ink">{unique}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />

              <Area
                type="monotone"
                dataKey="visits"
                name="Total Visits"
                stroke="#D4AF37"
                strokeWidth={2.5}
                fill="url(#visGoldGrad)"
              />
              <Area
                type="monotone"
                dataKey="uniqueVisitors"
                name="Unique Visitors"
                stroke="#38BDF8"
                strokeWidth={2}
                fill="url(#visSkyGrad)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Breakdown: Top Visited Pages & Devices / Browsers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Pages */}
        <div className="rounded-xl border border-line/60 bg-card/60 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-ink sm:text-base">
                Top Visited Pages
              </h3>
              <p className="text-xs text-faint">Most viewed pages and paths</p>
            </div>
            <Badge tone="neutral" className="border-line text-[11px] text-faint">
              {topPages.length} tracked
            </Badge>
          </div>

          <div className="space-y-3">
            {topPages.map((page, idx) => (
              <div key={page.path} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-mono text-faint w-4 text-[11px]">
                      #{idx + 1}
                    </span>
                    <span className="font-medium text-ink truncate">
                      {page.path === "/" ? "/ (Homepage)" : page.path}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-faint">{page.visits} views</span>
                    <span className="font-medium text-gold w-10 text-right">
                      {page.percentage}%
                    </span>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="h-1.5 w-full rounded-full bg-line/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gold transition-all duration-300"
                    style={{ width: `${Math.max(4, page.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Devices & Browsers */}
        <div className="space-y-6">
          {/* Device Breakdown */}
          <div className="rounded-xl border border-line/60 bg-card/60 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-ink sm:text-base mb-1">
              Devices Breakdown
            </h3>
            <p className="text-xs text-faint mb-4">Visitor client hardware distribution</p>

            <div className="grid grid-cols-3 gap-2">
              {deviceBreakdown.map((dev) => (
                <div
                  key={dev.name}
                  className="rounded-lg border border-line/40 bg-canvas/40 p-3 text-center"
                >
                  <div className="flex justify-center mb-1">
                    {getDeviceIcon(dev.name)}
                  </div>
                  <div className="text-xs font-semibold text-ink">{dev.name}</div>
                  <div className="mt-1 text-lg font-bold text-gold">
                    {dev.percentage}%
                  </div>
                  <div className="text-[10px] text-faint">{dev.count} visits</div>
                </div>
              ))}
            </div>
          </div>

          {/* Browsers Breakdown */}
          <div className="rounded-xl border border-line/60 bg-card/60 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-ink sm:text-base mb-1">
              Top Browsers
            </h3>
            <p className="text-xs text-faint mb-3">Client web browser share</p>

            <div className="space-y-2.5">
              {browserBreakdown.slice(0, 4).map((b) => (
                <div key={b.name} className="flex items-center justify-between text-xs">
                  <span className="text-ink font-medium">{b.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-faint">{b.count} visits</span>
                    <span className="font-semibold text-sky-400 w-10 text-right">
                      {b.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Recent Visitor Log Table */}
      <div className="rounded-xl border border-line/60 bg-card/60 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-ink sm:text-base">
              Recent Activity Feed
            </h3>
            <p className="text-xs text-faint">
              Latest incoming page requests and visiting sessions
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live Tracking
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-faint">
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium">Path</th>
                <th className="pb-2 font-medium">Device / OS</th>
                <th className="pb-2 font-medium">Browser</th>
                <th className="pb-2 font-medium">Referrer</th>
                <th className="pb-2 font-medium text-right">Visitor ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {recentVisits.map((item) => {
                const date = new Date(item.timestamp);
                const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
                return (
                  <tr key={item.id} className="text-ink hover:bg-white/[0.02]">
                    <td className="py-2.5 whitespace-nowrap text-faint">
                      {dateStr} · {timeStr}
                    </td>
                    <td className="py-2.5 whitespace-nowrap font-medium text-gold">
                      {item.path}
                    </td>
                    <td className="py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getDeviceIcon(item.device)}
                        <span>{item.device} ({item.os})</span>
                      </div>
                    </td>
                    <td className="py-2.5 whitespace-nowrap text-faint">
                      {item.browser}
                    </td>
                    <td className="py-2.5 whitespace-nowrap text-faint">
                      {item.referrer}
                    </td>
                    <td className="py-2.5 whitespace-nowrap text-right font-mono text-[11px] text-faint">
                      {item.visitorId.slice(0, 10)}…
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
