import { DashboardAnalytics } from "@/components/DashboardAnalytics";
import { DashboardToolbar } from "@/components/DashboardToolbar";
import { RecentPaymentsTable } from "@/components/RecentPaymentsTable";
import { StatCard } from "@/components/StatCard";
import { TrialBanner } from "@/components/TrialBanner";
import { kpis } from "@/lib/data";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Subscription / free-trial status (from the backend) */}
      <TrialBanner className="mb-5" />

      {/* Page header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="animate-fade-up">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
            Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-subtle">
            Welcome back, Marcus — $184.9K in monthly recurring revenue, up 15.7% year
            over year.
          </p>
        </div>
        <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
          <DashboardToolbar />
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:mt-8">
        {/* KPI strip */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {kpis.map((kpi, index) => (
            <StatCard key={kpi.id} kpi={kpi} index={index} />
          ))}
        </div>

        <DashboardAnalytics />

        {/* Recent payments */}
        <RecentPaymentsTable />
      </div>
    </div>
  );
}