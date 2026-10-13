"use client";

import { ChartColumn, ChartLine, ChartPie, Download, RefreshCcw } from "lucide-react";
import { DashboardCard } from "@/components/DashboardCard";
import { LegendChips } from "@/components/charts/ChartTooltip";
import { MembershipDonutChart } from "@/components/charts/MembershipDonutChart";
import { MembershipGrowthChart } from "@/components/charts/MembershipGrowthChart";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { UpcomingExpirations } from "@/components/UpcomingExpirations";
import { revenueSeries } from "@/lib/data";
import { formatCurrency, formatPercent } from "@/lib/format";

const avgRevenue =
  revenueSeries.reduce((sum, point) => sum + point.revenue, 0) / revenueSeries.length;

const bestMonth = revenueSeries.reduce((best, point) =>
  point.revenue > best.revenue ? point : best,
);

/** Revenue analytics + distribution, membership growth + expirations. */
export function DashboardAnalytics() {
  return (
    <>
      {/* Revenue analytics + membership distribution */}
      <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-3">
        <DashboardCard
          title="Revenue Analytics"
          subtitle="Monthly revenue vs. the same month last year"
          icon={ChartLine}
          className="xl:col-span-2"
          action={
            <LegendChips
              items={[
                { label: "This year", color: "#E8B84D" },
                { label: "Last year", color: "#4B4B52" },
              ]}
            />
          }
          menuItems={[
            { label: "Download data", icon: Download },
            { label: "Change comparison", icon: RefreshCcw },
          ]}
        >
          <div className="mt-5">
            <RevenueChart />
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-line/60 pt-4">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
                Avg monthly
              </dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums text-ink">
                {formatCurrency(Math.round(avgRevenue))}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
                Best month
              </dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums text-ink">
                {formatCurrency(bestMonth.revenue)}
                <span className="ml-1.5 font-normal text-faint">{bestMonth.month}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">
                YoY growth
              </dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums text-success">
                +{formatPercent(15.7)}
              </dd>
            </div>
          </dl>
        </DashboardCard>

        <DashboardCard
          title="Membership Distribution"
          subtitle="Active plans by billing cycle"
          icon={ChartPie}
          menuItems={[
            { label: "View all plans", icon: RefreshCcw },
            { label: "Export summary", icon: Download },
          ]}
        >
          <div className="mt-2">
            <MembershipDonutChart />
          </div>
        </DashboardCard>
      </div>

      {/* Membership growth + upcoming expirations */}
      <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-3">
        <DashboardCard
          title="Monthly Membership Growth"
          subtitle="New vs. churned members, last 7 months"
          icon={ChartColumn}
          className="xl:col-span-2"
          action={
            <LegendChips
              items={[
                { label: "Joined", color: "#E8B84D" },
                { label: "Left", color: "#3F3F46" },
              ]}
            />
          }
          menuItems={[
            { label: "View retention report", icon: RefreshCcw },
            { label: "Download data", icon: Download },
          ]}
        >
          <div className="mt-5">
            <MembershipGrowthChart />
          </div>
        </DashboardCard>

        <UpcomingExpirations />
      </div>
    </>
  );
}