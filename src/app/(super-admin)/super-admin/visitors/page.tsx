import type { Metadata } from "next";
import { VisitorAnalyticsView } from "@/components/super-admin/VisitorAnalyticsView";

export const metadata: Metadata = {
  title: "Site Visitors",
  description: "Website traffic and visitor statistics. Super Admin access only.",
};

export default function SuperAdminVisitorsPage() {
  return <VisitorAnalyticsView />;
}

