import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingNavbar } from "@/components/landing/LandingNavbar";

export const metadata: Metadata = {
  title: "Gym Management CRM",
  description:
    "The all-in-one gym CRM for members, attendance, payments, workouts, trainers and business growth.",
};

/**
 * Public marketing landing page at the default route. The authenticated
 * dashboard now lives at /dashboard so visitors can reach this page signed out.
 */
export default function LandingPage() {
  return (
    <div className="dg-landing min-h-screen bg-lp-canvas text-lp-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-lp-gold focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-[#171203]"
      >
        Skip to content
      </a>
      <LandingNavbar />
      <main>
        <HeroSection />
      </main>
    </div>
  );
}
