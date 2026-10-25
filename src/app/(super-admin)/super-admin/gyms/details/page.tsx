import type { Metadata } from "next";
import { PlatformGymDetailsScreen } from "./screen";

export const metadata: Metadata = {
  title: "Gym details",
  description: "Subscription history, owner details and access controls for a gym.",
};

export default function SuperAdminGymDetailsPage() {
  return <PlatformGymDetailsScreen />;
}
