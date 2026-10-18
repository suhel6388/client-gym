import type { ReactNode } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";

/** Unauthenticated screens: dark-and-gold backdrop, no app chrome. */
export default function AuthRouteLayout({ children }: { children: ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
