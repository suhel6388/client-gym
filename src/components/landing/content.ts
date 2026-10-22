import {
  Building2,
  CalendarCheck,
  ChartColumn,
  Clock3,
  CreditCard,
  Dumbbell,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  LogIn,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Marketing copy and navigation for the public landing page.
 *
 * Keep claims (trial terms, setup time, customer counts) in this file so they
 * can be replaced without touching layout code. The trust figures below are
 * presentation copy, not verified platform metrics.
 */

export type FeatureHighlight = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type LandingNavLink = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export type LandingNavItem = {
  label: string;
  href: string;
  children?: LandingNavLink[];
};

export const HERO_COPY = {
  badge: "#1 Gym Management CRM",
  headline: {
    lead: "Manage. Engage.",
    continuation: "Grow with ",
    brand: "DarkGoldGym.",
  },
  description:
    "The all-in-one gym CRM to manage members, attendance, payments, workouts, trainers and grow your fitness business effortlessly.",
  primaryCta: {
    label: "Start Free Trial",
    // Existing route that creates the 14-day trial account.
    href: "/signup",
  },
  secondaryCta: {
    label: "Book a Demo",
    // A live walkthrough of the product preview already on this page.
    href: "/#solutions",
  },
} as const;

export const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [
  {
    id: "feature-members",
    label: "Member Management",
    description: "Profiles, renewals and member history in one place.",
    icon: Users,
  },
  {
    id: "feature-attendance",
    label: "Attendance Tracking",
    description: "Check-ins, check-outs and daily gym activity.",
    icon: CalendarCheck,
  },
  {
    id: "feature-payments",
    label: "Payments & Billing",
    description: "Collect dues, issue receipts and track cash flow.",
    icon: CreditCard,
  },
  {
    id: "feature-workouts",
    label: "Workout Programs",
    description: "Build training plans members actually follow.",
    icon: Dumbbell,
  },
  {
    id: "feature-reports",
    label: "Reports & Analytics",
    description: "See revenue, retention and growth at a glance.",
    icon: ChartColumn,
  },
];

export type TrustIndicator = {
  label: string;
  icon: LucideIcon;
};

export const TRUST_INDICATORS: TrustIndicator[] = [
  { label: "No Credit Card Required", icon: CreditCard },
  { label: "Setup in 5 Minutes", icon: Clock3 },
  { label: "Trusted by 10,000+ Gyms", icon: Building2 },
];

export const LANDING_NAV: LandingNavItem[] = [
  {
    label: "Features",
    href: "/#features",
    children: FEATURE_HIGHLIGHTS.map((feature) => ({
      label: feature.label,
      href: `/#${feature.id}`,
      description: feature.description,
      icon: feature.icon,
    })),
  },
  {
    label: "Solutions",
    href: "/#solutions",
    children: [
      {
        label: "Gym Operations",
        href: "/#solutions",
        description: "One live view of your entire gym.",
        icon: LayoutDashboard,
      },
      {
        label: "Revenue Insights",
        href: "/#revenue-preview",
        description: "Track collections and billing trends.",
        icon: Wallet,
      },
      {
        label: "Member Retention",
        href: "/#membership-preview",
        description: "Spot renewals before they lapse.",
        icon: HeartHandshake,
      },
    ],
  },
  {
    label: "Pricing",
    // The public trial flow is the existing pricing entry point.
    href: "/signup",
  },
  {
    label: "Resources",
    href: "/terms",
    children: [
      {
        label: "Privacy Policy",
        href: "/privacy",
        description: "How gym and member data is handled.",
        icon: ShieldCheck,
      },
      {
        label: "Terms of Service",
        href: "/terms",
        description: "Platform and subscription terms.",
        icon: FileText,
      },
      {
        label: "Sign In",
        href: "/login",
        description: "Return to your gym workspace.",
        icon: LogIn,
      },
    ],
  },
  {
    label: "About Us",
    href: "/#about",
  },
];
