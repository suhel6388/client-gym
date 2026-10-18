import type { Metadata } from "next";
import { PaymentsPage } from "@/components/PaymentsPage";

export const metadata: Metadata = {
  title: "Payment Management",
  description:
    "Track gym collections, payment methods, and transaction history.",
};

export default function Payments() {
  return <PaymentsPage />;
}
