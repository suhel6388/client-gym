import type { Metadata } from "next";
import SetupGymScreen from "./screen";

export const metadata: Metadata = {
  title: "Set up your gym",
};

export default function SetupGymPage() {
  return <SetupGymScreen />;
}
