import type { Metadata } from "next";
import { PlatformSettingsPage } from "@/components/super-admin/PlatformSettingsPage";

export const metadata: Metadata = {
  title: "Platform settings",
  description: "Customise platform-wide WhatsApp follow-up messages.",
};

export default function SuperAdminSettingsPage() {
  return <PlatformSettingsPage />;
}
