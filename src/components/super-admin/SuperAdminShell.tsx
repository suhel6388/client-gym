"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarClock,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useSession } from "@/components/auth/SessionProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { SUPER_ADMIN_PATH } from "@/lib/api";
import { platformInitials } from "@/lib/super-admin-view";
import DarkGoldLogoHorizontal from "../../../public/logo_hr";

type PlatformNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

const NAV_ITEMS: PlatformNavItem[] = [
  {
    label: "Overview",
    href: SUPER_ADMIN_PATH,
    icon: LayoutDashboard,
    description: "Revenue and platform health",
  },
  {
    label: "Gyms",
    href: `${SUPER_ADMIN_PATH}/gyms`,
    icon: Building2,
    description: "Every tenant on the platform",
  },
  {
    label: "Owners",
    href: `${SUPER_ADMIN_PATH}/owners`,
    icon: UsersRound,
    description: "Gym owner accounts",
  },
  {
    label: "Schedule calls",
    href: `${SUPER_ADMIN_PATH}/schedule-calls`,
    icon: CalendarClock,
    description: "Landing-page call enquiries",
  },
  {
    label: "Activity",
    href: `${SUPER_ADMIN_PATH}/activity`,
    icon: History,
    description: "Administrative audit trail",
  },
  {
    label: "Settings",
    href: `${SUPER_ADMIN_PATH}/settings`,
    icon: Settings,
    description: "WhatsApp message templates",
  },
];

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function isActive(pathname: string, href: string): boolean {
  if (href === SUPER_ADMIN_PATH) return pathname === SUPER_ADMIN_PATH;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function currentSection(pathname: string): string {
  const match = [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isActive(pathname, item.href));
  return match?.label ?? "Platform console";
}

/**
 * Dedicated chrome for the SaaS owner. Deliberately separate from AppShell: a
 * platform admin has no gym context, no member notifications and no gym
 * quick-actions, so reusing the gym sidebar would expose irrelevant controls.
 */
export function SuperAdminShell({ children }: { children: ReactNode }) {
  const pathname = normalizePath(usePathname() ?? SUPER_ADMIN_PATH);
  const { user, signOut } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const section = currentSection(pathname);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label="Close platform navigation"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/65 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r border-line bg-panel transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line/60 px-5">
          <DarkGoldLogoHorizontal className="h-9 w-auto" />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto inline-flex size-8 items-center justify-center rounded-lg text-faint hover:bg-card hover:text-ink lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-4" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="mx-3 mt-4 flex items-center gap-2 rounded-xl border border-gold/20 bg-gradient-to-b from-gold/[0.12] to-transparent px-3 py-2.5">
          <ShieldCheck className="size-4 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-gold">Platform Console</p>
            <p className="truncate text-[10.5px] text-faint">SaaS owner access</p>
          </div>
        </div>

        <nav className="scroll-thin flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 select-none px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
            Administration
          </p>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors duration-150",
                      active
                        ? "bg-gold/10 text-gold"
                        : "text-subtle hover:bg-card hover:text-ink",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-gold transition-opacity duration-150",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <Icon className="size-4.5 shrink-0" strokeWidth={1.75} aria-hidden />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-line/60 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-card/60 p-3">
            <Avatar
              initials={platformInitials(user?.name)}
              index={0}
              className="size-9"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink">
                {user?.name ?? "Platform Owner"}
              </p>
              <p className="truncate text-[11px] text-faint">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-card-hover hover:text-danger"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line/70 bg-canvas/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-card text-subtle hover:border-line-strong hover:text-ink lg:hidden"
            aria-label="Open platform navigation"
          >
            <Menu className="size-4.5" strokeWidth={1.75} aria-hidden />
          </button>

          <div className="flex min-w-0 items-center gap-2.5">
            <span className="hidden size-8 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20 sm:inline-flex">
              <ShieldCheck className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink">{section}</p>
              <p className="truncate text-[11px] text-faint">
                Platform-wide data · all gyms
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-gold/12 px-2.5 py-1 text-[11px] font-semibold text-gold ring-1 ring-inset ring-gold/25 sm:inline-flex">
              <ShieldCheck className="size-3" strokeWidth={2} aria-hidden />
              Super admin
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void signOut()}
              className="hidden sm:inline-flex"
            >
              <LogOut className="size-3.5" strokeWidth={1.75} aria-hidden />
              Sign out
            </Button>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
