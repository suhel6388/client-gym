import {
  CalendarCheck,
  ChartColumn,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Settings,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Small pill rendered on the right of the row (counts, status). */
  badge?: string;
  badgeTone?: "gold" | "danger";
  /** When set, the item is only shown to these backend roles. */
  roles?: string[];
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Members", href: "/members", icon: Users, badge: "2.8k" },
      { label: "Memberships", href: "/memberships", icon: CreditCard },
      { label: "Attendance", href: "/attendance", icon: CalendarCheck },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Payments",
        href: "/payments",
        icon: Wallet,
        badge: "38",
        badgeTone: "gold",
      },
      { label: "Expenses", href: "/expenses", icon: CreditCard },
      { label: "Plans & Pricing", href: "/plans", icon: Dumbbell },
      { label: "Reports", href: "/reports", icon: ChartColumn },
    ],
  },
  {
    title: "Manage",
    items: [
      // { label: "Trainers", href: "/trainers", icon: UserCog },
      // { label: "Classes", href: "/classes", icon: GraduationCap },
      { label: "Staff", href: "/staff", icon: UserCog, roles: ["ADMIN"] },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

/** Flat lookup used by the navbar breadcrumb + the placeholder route. */
export const navIndex: Record<string, { label: string; group: string }> = Object.fromEntries(
  navGroups.flatMap((group) =>
    group.items.map((item) => [
      item.href === "/" ? "/" : item.href.slice(1),
      { label: item.label, group: group.title },
    ]),
  ),
);

/** Resolves a pathname to the label shown in the navbar. */
export function resolveNavLabel(pathname: string): string {
  const key = pathname === "/" ? "/" : pathname.replace(/^\/+|\/+$/g, "").split("/")[0];
  return navIndex[key]?.label ?? "Not found";
}
