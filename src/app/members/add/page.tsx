import type { Metadata } from "next";
import { AddMemberPageClient } from "@/components/AddMemberPageClient";

export const metadata: Metadata = {
  title: "Add Member",
};

export default function AddMemberPage() {
  return <AddMemberPageClient />;
}
