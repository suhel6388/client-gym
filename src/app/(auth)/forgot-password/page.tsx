import type { Metadata } from "next";
import ForgotPasswordScreen from "./screen";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
}
