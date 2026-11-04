"use client";

import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CreditCard,
  IndianRupee,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Trash2,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { openCreateMember } from "@/lib/events";
import { resolveNavLabel } from "@/lib/nav";
import { cn } from "@/lib/cn";
import { useClickOutside } from "@/hooks/use-click-outside";
import {
  clearNotifications,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  notificationMeta,
  subscribeNotifications,
  type NotificationItem,
} from "@/lib/notification-events";
import {
  isSoundEnabled,
  preloadNotificationSound,
  setSoundEnabled,
} from "@/lib/notification-sound";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { KBarSearchButton, KBarSearchButtonMobile } from "./KBarSearchButton";
import { ToggleTheme } from "./lightswind/toggle-theme";
import { useSession } from "./auth/SessionProvider";

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

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
  const { user, signOut } = useSession();

  const displayName = user?.name?.trim() || "Gym Owner";
  const displayEmail = user?.email ?? "";
  const displayRole =
    user?.role === "RECEPTIONIST" ? "Receptionist" : "Owner";
  const displayInitials = initialsFrom(displayName);
  const [signingOut, setSigningOut] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));

  const notifItems = useSyncExternalStore(
    subscribeNotifications,
    getNotifications,
    () => [] as NotificationItem[],
  );
  const unreadCount = useSyncExternalStore(
    subscribeNotifications,
    getUnreadCount,
    () => 0,
  );

  useEffect(() => {
    setSoundOn(isSoundEnabled());
    preloadNotificationSound();
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  }, [soundOn]);

  return (
    <header id="top-navbar" className="sticky top-0 z-30 border-b border-line bg-nav/95 backdrop-blur supports-[backdrop-filter]:bg-nav/85">
      <div className="flex h-14 items-center gap-1.5 px-3 sm:h-16 sm:gap-3 sm:px-6">
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
        <h1 className="min-w-0 truncate text-sm font-semibold text-ink sm:hidden">{title}</h1>

        {/* Spacer keeps the right cluster pinned */}
        <div className="flex-1" />

        {/* Search */}
        <KBarSearchButton />
        <KBarSearchButtonMobile />

        {/* Global theme switch (Lightswind swipe-down). Phones use the one in
            the navigation drawer so the top bar keeps room for actions. */}
        <div className="hidden sm:block">
          <ToggleTheme animationType="swipe-down" />
        </div>

        {/* Quick actions */}
        <Button
          variant="primary"
          size="icon"
          aria-label="Add member"
          title="Add member"
          onClick={openCreateMember}
        >
          <Plus className="size-4.5" strokeWidth={2.25} aria-hidden />
        </Button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            aria-label={`Notifications (${unreadCount} unread)`}
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((open) => !open)}
            className={cn(
              "relative inline-flex size-9 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-card hover:text-ink",
              notifOpen && "bg-card text-ink",
            )}
          >
            <Bell className="size-4.5" strokeWidth={1.75} aria-hidden />
            {unreadCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex size-[18px] items-center justify-center rounded-full bg-gold text-[9px] font-bold text-black ring-2 ring-nav"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 z-40 w-[min(24rem,calc(100vw-1.5rem))] animate-pop overflow-hidden rounded-xl border border-line-strong bg-elevated shadow-pop">
              <div className="flex items-center justify-between border-b border-line/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-ink">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-gold ring-1 ring-inset ring-gold/20">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleSound}
                    aria-label={soundOn ? "Notification sound enabled" : "Notification sound muted"}
                    title={soundOn ? "Sound enabled (Click to mute)" : "Sound muted (Click to enable)"}
                    className="inline-flex size-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-card-hover hover:text-ink"
                  >
                    {soundOn ? (
                      <Volume2 className="size-3.5 text-gold" strokeWidth={1.75} aria-hidden />
                    ) : (
                      <VolumeX className="size-3.5" strokeWidth={1.75} aria-hidden />
                    )}
                  </button>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      title="Mark all as read"
                      className="inline-flex size-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-card-hover hover:text-ink"
                    >
                      <CheckCheck className="size-3.5" strokeWidth={1.75} aria-hidden />
                    </button>
                  )}
                  {notifItems.length > 0 && (
                    <button
                      type="button"
                      onClick={clearNotifications}
                      title="Clear notifications"
                      className="inline-flex size-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-card-hover hover:text-danger"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                    </button>
                  )}
                </div>
              </div>

              <div className="scroll-thin max-h-80 overflow-y-auto">
                {notifItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <BellOff className="size-7 text-faint/50" strokeWidth={1.5} aria-hidden />
                    <p className="mt-2 text-xs font-medium text-subtle">No notifications yet</p>
                    <p className="mt-0.5 text-[11px] text-faint">
                      Transactions will show here in real time.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-line/40">
                    {notifItems.map((item) => {
                      const meta = notificationMeta(item.type);
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => markAsRead(item.id)}
                            className={cn(
                              "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-card-hover",
                              !item.read && "bg-gold/[0.04]",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold uppercase tracking-wider",
                                meta.bgColor,
                                meta.color,
                              )}
                            >
                              {meta.label.slice(0, 3)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-1">
                                <span className="block truncate text-[13px] font-medium text-ink">
                                  {item.title}
                                </span>
                                {!item.read && (
                                  <span className="size-1.5 shrink-0 rounded-full bg-gold" />
                                )}
                              </span>
                              <span className="mt-0.5 block text-xs leading-relaxed text-subtle">
                                {item.description}
                              </span>
                              <span className="mt-1 block text-[10.5px] tabular-nums text-faint">
                                {timeAgo(item.timestamp)}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
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
              initials={displayInitials}
              className="size-8 text-[10px] ring-gold/40"
            />
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-[13px] font-semibold leading-tight text-ink">
                {displayName}
              </span>
              <span className="block truncate text-[11px] leading-tight text-faint">
                {displayRole}
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
              className="absolute right-0 top-11 z-40 w-[min(14rem,calc(100vw-1.5rem))] animate-pop overflow-hidden rounded-xl border border-line-strong bg-elevated py-1.5 shadow-pop"
            >
              <div className="border-b border-line/60 px-4 py-3">
                <p className="text-[13px] font-semibold text-ink">{displayName}</p>
                <p className="mt-0.5 truncate text-xs text-faint">{displayEmail}</p>
              </div>
              {[
                { icon: User, label: "My profile" },
                { icon: IndianRupee, label: "Billing & plans" },
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
                  disabled={signingOut}
                  onClick={() => {
                    setSigningOut(true);
                    void signOut();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] text-danger transition-colors hover:bg-danger/10 disabled:opacity-60"
                >
                  <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}