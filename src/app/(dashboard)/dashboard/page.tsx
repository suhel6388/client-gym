import { DashboardOverview } from "@/components/DashboardOverview";

/**
 * Authenticated gym dashboard. The public marketing page owns the default "/"
 * route; this is the canonical destination after sign-in.
 */
export default function DashboardPage() {
  return <DashboardOverview />;
}
