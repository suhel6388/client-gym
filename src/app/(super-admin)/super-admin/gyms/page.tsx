import type { Metadata } from "next";
import { PlatformGymsPage } from "@/components/super-admin/PlatformGymsPage";

export const metadata: Metadata = {
  title: "Gyms",
  description: "Search and manage every gym on the platform.",
};

export default function SuperAdminGymsPage() {
  return <PlatformGymsPage />;
}
