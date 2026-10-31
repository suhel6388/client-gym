import {
  BarChart3,
  CalendarCheck,
  CreditCard,
  Dumbbell,
  ShieldCheck,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";

export const HERO_COPY = {
  badge: "All-in-One Gym Management Software",
  headline: {
    lead: "Simplify Your Gym.",
    continuation: "Grow",
    brand: " Your Business.",
  },
  description:
    "The all-in-one gym CRM to manage members, attendance, payments, workouts, trainers and grow your fitness business effortlessly.",
  primaryCta: { label: "Start Free Trial", href: "/signup" },
  secondaryCta: { label: "Schedule a Call" },
};

export type IconItem = { id: string; label: string; icon: LucideIcon };

export const FEATURE_HIGHLIGHTS: IconItem[] = [
  { id: "member-management", label: "Member Management", icon: Users },
  { id: "attendance-tracking", label: "Attendance Tracking", icon: CalendarCheck },
  { id: "payments-billing", label: "Payments & Billing", icon: CreditCard },
  { id: "workout-programs", label: "Workout & Programs", icon: Dumbbell },
  { id: "reports-analytics", label: "Reports & Analytics", icon: BarChart3 },
];

export const TRUST_INDICATORS: { label: string; icon: LucideIcon }[] = [
  { label: "No Credit Card Required", icon: ShieldCheck },
  { label: "Setup in 5 Minutes", icon: Timer },
  { label: "Trusted by 10,000+ Gyms", icon: ShieldCheck },
];
