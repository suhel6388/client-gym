import type { Metadata } from "next";
import { ScheduleCallsPage } from "@/components/super-admin/ScheduleCallsPage";

export const metadata: Metadata = {
  title: "Schedule call enquiries",
  description:
    "View, edit and follow up on every schedule call request from the landing page.",
};

export default function SuperAdminScheduleCallsPage() {
  return <ScheduleCallsPage />;
}
