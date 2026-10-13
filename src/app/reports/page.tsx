import type { Metadata } from "next";
import { ReportsPage } from "@/components/ReportsPage";

export const metadata: Metadata = {
  title: "Reports & Analytics",
  description:
    "Track gym performance, revenue, memberships, attendance, and expenses.",
};

export default function Reports() {
  return <ReportsPage />;
}
