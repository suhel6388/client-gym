import type { Metadata } from "next";
import { AttendancePage } from "@/components/AttendancePage";

export const metadata: Metadata = {
  title: "Attendance Management",
  description:
    "Track gym visits, manage check-ins, and monitor member attendance.",
};

export default function Attendance() {
  return <AttendancePage />;
}
