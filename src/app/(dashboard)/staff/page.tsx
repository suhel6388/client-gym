import type { Metadata } from "next";
import { StaffPage } from "@/components/StaffPage";

export const metadata: Metadata = {
  title: "Staff",
  description:
    "Create and manage receptionist logins for your gym. Only the gym owner can add or remove staff accounts.",
};

export default function Staff() {
  return <StaffPage />;
}
