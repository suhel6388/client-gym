import type { Metadata } from "next";
import { PlatformActivityPage } from "@/components/super-admin/PlatformActivityPage";

export const metadata: Metadata = {
  title: "Activity",
  description: "Audit trail for platform administration actions.",
};

export default function SuperAdminActivityPage() {
  return <PlatformActivityPage />;
}
