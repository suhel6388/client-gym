import type { Metadata } from "next";
import { ExpensesPage } from "@/components/ExpensesPage";

export const metadata: Metadata = {
  title: "Expense Management",
  description:
    "Track gym operating costs, equipment maintenance, utilities, and other expenses.",
};

export default function Expenses() {
  return <ExpensesPage />;
}