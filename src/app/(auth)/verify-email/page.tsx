import type { Metadata } from "next";
import VerifyEmailScreenWithSuspense from "./screen";

export const metadata: Metadata = {
  title: "Verify your email",
};

export default function VerifyEmailPage() {
  return <VerifyEmailScreenWithSuspense />;
}
