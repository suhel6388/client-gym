import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <AuthCard heading="Terms of Service" subtitle="DarkGoldGym gym management platform" showLogo={false}>
      <div className="space-y-4 text-[13px] leading-relaxed text-auth-muted">
        <p>
          This page is a placeholder. Replace it with your platform&apos;s full Terms of Service
          before launching to production — it is linked from the sign-up consent checkbox.
        </p>
        <p>
          Your terms should cover account responsibilities, subscription and free-trial billing,
          acceptable use, data handling, and termination.
        </p>
        <Link
          href="/signup"
          className="inline-flex font-semibold text-auth-gold transition-colors hover:text-auth-gold-highlight"
        >
          ← Back to sign up
        </Link>
      </div>
    </AuthCard>
  );
}
