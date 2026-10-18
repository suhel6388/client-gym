import type { Metadata } from "next";
import ResetPasswordScreenWithSuspense from "./screen";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ResetPasswordPage() {
  return <ResetPasswordScreenWithSuspense />;
}
