import type { Metadata } from "next";
import { MembershipsPage } from "@/components/MembershipsPage";

export const metadata: Metadata = {
  title: "Membership Management",
  description:
    "Manage membership plans, subscriptions, renewals, and expirations.",
};

export default function Memberships() {
  return <MembershipsPage />;
}
