import {
  BarChart3,
  CalendarCheck,
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

export const LANDING_NAV: LandingNavItem[] = [
  {
    label: "Features",
    href: "/#features",
    children: [
      {
        label: "Member Management",
        href: "/#member-management",
        description: "Profiles, renewals and member history in one place.",
        icon: Users,
      },
      {
        label: "Attendance Tracking",
        href: "/#attendance-tracking",
        description: "Check-ins, check-outs and daily gym activity.",
        icon: CalendarCheck,
      },
      {
        label: "Payments & Billing",
        href: "/#payments-billing",
        description: "Collect dues, issue receipts and track cash flow.",
        icon: CreditCard,
      },
      {
        label: "Workout & Programs",
        href: "/#workout-programs",
        description: "Build training plans members actually follow.",
        icon: Dumbbell,
      },
      {
        label: "Reports & Analytics",
        href: "/#reports-analytics",
        description: "See revenue, retention and growth at a glance.",
        icon: BarChart3,
      },
    ],
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
    href: "#pricing",
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
