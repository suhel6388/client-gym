import type { Metadata } from "next";
import { PlansPage } from "@/components/PlansPage";

export const metadata: Metadata = {
  title: "Plans & Pricing",
  description:
    "Manage subscription plans, pricing, and membership features for your gym.",
};

export default function Plans() {
  return <PlansPage />;
}
