import type { Metadata } from "next";
import { PlatformOwnersPage } from "@/components/super-admin/PlatformOwnersPage";

export const metadata: Metadata = {
  title: "Gym owners",
  description: "Search every gym owner account and its subscription.",
};

export default function SuperAdminOwnersPage() {
  return <PlatformOwnersPage />;
}
