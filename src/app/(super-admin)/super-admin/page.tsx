import type { Metadata } from "next";
import { PlatformDashboard } from "@/components/super-admin/PlatformDashboard";

export const metadata: Metadata = {
  title: "Platform overview",
  description: "Revenue, subscriptions and tenant health across every gym.",
};

export default function SuperAdminDashboardPage() {
  return <PlatformDashboard />;
}
