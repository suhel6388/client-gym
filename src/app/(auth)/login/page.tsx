import type { Metadata } from "next";
import LoginScreenWithSuspense from "./screen";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return <LoginScreenWithSuspense />;
}
