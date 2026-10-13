"use client";

import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  CreditCard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  TriangleAlert,
  User,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { currentUser, notifications } from "@/lib/data";
import { resolveNavLabel } from "@/lib/nav";
import { cn } from "@/lib/cn";
import { useClickOutside } from "@/hooks/use-click-outside";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";

const notificationIcon = {
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: CircleAlert,
} as const;

const notificationTone = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
} as const;

type TopNavbarProps = {
  onOpenMobile: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
};

export function TopNavbar({
  onOpenMobile,
  onToggleCollapse,
  collapsed,
}: TopNavbarProps) {
  const pathname = usePathname();
  const title = resolveNavLabel(pathname);

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-nav/95 backdrop-blur supports-[backdrop-filter]:bg-nav/85">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6">
        {/* Mobile: open drawer */}
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open navigation"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-card hover:text-ink lg:hidden"
        >
          <Menu className="size-4.5" strokeWidth={1.75} aria-hidden />
        </button>

        {/* Desktop: collapse sidebar */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden size-9 shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-card hover:text-ink lg:inline-flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4.5" strokeWidth={1.75} aria-hidden />
          ) : (
            <PanelLeftClose className="size-4.5" strokeWidth={1.75} aria-hidden />
          )}
        </button>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 sm:flex">
          <span className="text-xs text-faint">Home</span>
          <ChevronRight className="size-3.5 shrink-0 text-faint" aria-hidden />
          <span className="truncate text-xs font-medium text-ink">{title}</span>
        </nav>
        <h1 className="truncate text-sm font-semibold text-ink sm:hidden">{title}</h1>

        {/* Spacer keeps the right cluster pinned */}
        <div className="flex-1" />

        {/* Search */}
        <div className="relative hidden w-56 md:block xl:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search members, payments, plans…"
            className="h-9 w-full rounded-lg border border-line bg-card pr-12 pl-9 text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-gold/50"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-line bg-card-hover px-1.5 py-0.5 font-sans text-[10px] font-medium text-faint">
            ⌘K
          </kbd>
        </div>
        <button
          type="button"
          aria-label="Search"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-card hover:text-ink md:hidden"
        >
          <Search className="size-4.5" strokeWidth={1.75} aria-hidden />
        </button>

        {/* Quick actions */}
        <Button
          variant="primary"
          size="icon"
          aria-label="Add member"
          title="Add member"
          className="hidden sm:inline-flex"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("open-add-member"));
            }
          }}
        >
          <Plus className="size-4.5" strokeWidth={2.25} aria-hidden />
        </Button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            aria-label={`Notifications (${notifications.length} unread)`}
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((open) => !open)}
            className={cn(
              "relative inline-flex size-9 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-card hover:text-ink",
              notifOpen && "bg-card text-ink",
            )}
          >
            <Bell className="size-4.5" strokeWidth={1.75} aria-hidden />
            <span
              aria-hidden
              className="absolute right-2 top-2 size-2 rounded-full bg-danger ring-2 ring-nav"
            />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 z-40 w-80 animate-pop overflow-hidden rounded-xl border border-line-strong bg-elevated shadow-pop">
              <div className="flex items-center justify-between border-b border-line/60 px-4 py-3">
                <p className="text-[13px] font-semibold text-ink">Notifications</p>
                <span className="rounded-full bg-gold/12 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-gold ring-1 ring-inset ring-gold/20">
                  {notifications.length} new
                </span>
              </div>
              <ul className="scroll-thin max-h-80 overflow-y-auto">
                {notifications.map((item) => {
                  const Icon = notificationIcon[item.tone];
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-card-hover"
                      >
                        <span
                          className={cn(
                            "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-card ring-1 ring-inset ring-line",
                            notificationTone[item.tone],
                          )}
                        >
                          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-ink">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-subtle">
                            {item.body}
                          </span>
                          <span className="mt-1 block text-[11px] tabular-nums text-faint">
                            {item.time}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                className="block w-full border-t border-line/60 px-4 py-2.5 text-center text-xs font-medium text-gold transition-colors hover:bg-card-hover"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <span className="hidden h-6 w-px bg-line sm:block" aria-hidden />

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-2 text-left transition-colors hover:bg-card"
          >
            <Avatar
              initials={currentUser.initials}
              className="size-8 text-[10px] ring-gold/40"
            />
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-[13px] font-semibold leading-tight text-ink">
                {currentUser.name}
              </span>
              <span className="block truncate text-[11px] leading-tight text-faint">
                {currentUser.role}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 text-faint transition-transform duration-200",
                profileOpen && "rotate-180",
              )}
              strokeWidth={2}
              aria-hidden
            />
          </button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 top-12 z-40 w-56 animate-pop overflow-hidden rounded-xl border border-line-strong bg-elevated py-1.5 shadow-pop"
            >
              <div className="border-b border-line/60 px-4 py-3">
                <p className="text-[13px] font-semibold text-ink">{currentUser.name}</p>
                <p className="mt-0.5 truncate text-xs text-faint">{currentUser.email}</p>
              </div>
              {[
                { icon: User, label: "My profile" },
                { icon: CircleDollarSign, label: "Billing & plans" },
                { icon: CreditCard, label: "Payment methods" },
                { icon: Settings, label: "Settings", danger: false },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] text-subtle transition-colors hover:bg-card-hover hover:text-ink"
                >
                  <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                  {label}
                </button>
              ))}
              <div className="mt-1 border-t border-line/60 pt-1.5">
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] text-danger transition-colors hover:bg-danger/10"
                >
                  <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}