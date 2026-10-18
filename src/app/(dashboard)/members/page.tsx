import type { Metadata } from "next";
import { MembersPage } from "@/components/MembersPage";

export const metadata: Metadata = {
  title: "Members",
};

export default function Members() {
  return <MembersPage />;
}
