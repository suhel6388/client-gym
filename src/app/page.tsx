import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import GymFeatures from "@/components/landing/Features";
import GymPricing from "@/components/landing/Pricing";
import GymAbout from "@/components/landing/About";
import GymContact from "@/components/landing/Contact";
import GymReview from "@/components/landing/Review";
import GymReward from "@/components/landing/Reward";
import GymFooter from "@/components/landing/Footer";
import JsonLd from "@/components/landing/JsonLd";

export const metadata: Metadata = {
  title: "Gym Management Software India | DarkGold Gym CRM",
  description:
    "Manage gym members, attendance, payments, trainers, workout plans and memberships with DarkGold Gym CRM. Simplify gym operations with smart gym management software.",
  keywords: [
    "Gym Management Software",
    "Gym CRM Software",
    "Gym Management Software India",
    "Gym Billing Software",
    "Gym Member Management System",
    "Gym Attendance Management Software",
    "Fitness Management Software",
    "Gym Membership Management Software",
  ],
  alternates: {
    canonical: "https://darkgoldgym.duckdns.org/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Gym Management Software India | DarkGold Gym CRM",
    description:
      "Manage gym members, attendance, payments, trainers, workout plans and memberships with DarkGold Gym CRM. Simplify gym operations with smart gym management software.",
    url: "https://darkgoldgym.duckdns.org/",
    siteName: "DarkGold Gym CRM",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/darkgold.png",
        width: 1200,
        height: 630,
        alt: "DarkGold Gym CRM - Gym Management Software India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gym Management Software India | DarkGold Gym CRM",
    description:
      "Manage gym members, attendance, payments, trainers, workout plans and memberships with DarkGold Gym CRM. Simplify gym operations with smart gym management software.",
    images: ["/darkgold.png"],
  },
};

/**
 * Public marketing landing page at the default route. The authenticated
 * dashboard now lives at /dashboard so visitors can reach this page signed out.
 */
export default function LandingPage() {
  return (
    <div className="dg-landing min-h-screen bg-lp-canvas text-lp-ink">
      <JsonLd />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:gold-surface focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-[#171203]"
      >
        Skip to content
      </a>
      <LandingNavbar />
      <main id="main-content" tabIndex={-1} className="outline-none">
        <HeroSection />
        <GymFeatures />
        <GymPricing />
        <GymAbout />
        <GymContact />
        <GymReview />
        <GymReward />
        <GymFooter />
      </main>
    </div>
  );
}
