import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <AuthCard heading="Privacy Policy" subtitle="DarkGoldGym gym management platform" showLogo={false}>
      <div className="space-y-4 text-[13px] leading-relaxed text-auth-muted">
        <p>
          This page is a placeholder. Replace it with your platform&apos;s full Privacy Policy
          before launching to production — it is linked from the sign-up consent checkbox.
        </p>
        <p>
          Your policy should describe what owner and member data is collected, how it is stored
          (PostgreSQL), which email service delivers OTP and reset messages, and how users can
          request deletion.
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
