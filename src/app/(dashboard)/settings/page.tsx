import type { Metadata } from "next";
import { SettingsPage } from "@/components/SettingsPage";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Customize your gym's member communication, including WhatsApp renewal reminders.",
};

export default function Settings() {
  return <SettingsPage />;
}
