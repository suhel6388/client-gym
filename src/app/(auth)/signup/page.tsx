import type { Metadata } from "next";
import SignupScreen from "./screen";

export const metadata: Metadata = {
  title: "Create your account",
};

export default function SignupPage() {
  return <SignupScreen />;
}
