"use client";

import {
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { navGroups } from "@/lib/nav";
import { cn } from "@/lib/cn";
import { useSession } from "./auth/SessionProvider";
import { ToggleTheme } from "./lightswind/toggle-theme";
import DarkGoldLogo from "../../public/logo";
import DarkGoldLogoHorizontal from "../../public/logo_hr";

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useSession();

  // Keep the latest close handler in a ref so the navigation effect only runs
  // on a real path change. Depending on the inline callback would also fire
  // when `mobileOpen` flips to true and instantly close the drawer again.
  const closeMobileRef = useRef(onCloseMobile);
  closeMobileRef.current = onCloseMobile;

  // Close the mobile drawer after navigating, and keep the page behind it
  // locked while it is open so a touch-scroll never moves the background.
  useEffect(() => {
    closeMobileRef.current();
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen, onCloseMobile]);

  // Role-scoped navigation. The backend still enforces every endpoint; this
  // only keeps owner-only tools out of the staff sidebar.
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          !item.roles ||
          (user?.role ? item.roles.includes(user.role) : false),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label="Close sidebar"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={onCloseMobile}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        id="app-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,86vw)] flex-col border-r border-line bg-panel transition-[width,transform] duration-300 lg:w-64",
          collapsed ? "lg:w-20" : "lg:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center gap-3 border-b border-line/60 px-4 sm:px-5",
            collapsed && "lg:justify-center lg:px-0",
          )}
        >
          {/* Collapsed (desktop): gym logo only */}
          <DarkGoldLogo
            className={cn(
              "h-11 w-auto shrink-0",
              collapsed ? "hidden lg:block" : "hidden",
            )}
          />
          {/* Expanded: full horizontal logo */}
          <DarkGoldLogoHorizontal
            className={cn("h-9 w-auto min-w-0 max-w-full lg:h-10", collapsed && "lg:hidden")}
          />
          <div
            className={cn(
              "min-w-0 transition-opacity",
              collapsed && "lg:pointer-events-none lg:opacity-0",
            )}
          >
            {/* <p className="gold-text text-[17px] font-extrabold leading-none tracking-tight">
              Dark Gold
            </p> */}
            {/* <p className="mt-1.5 text-[9.5px] font-medium uppercase tracking-[0.22em] text-faint">
              Gym CRM
            </p> */}
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="ml-auto inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-card hover:text-ink lg:hidden"
          >
            <X className="size-4.5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        {/* Navigation */}
        <nav className="scroll-thin flex-1 overflow-y-auto px-3 py-5">
          <ul className="space-y-6">
            {visibleGroups.map((group) => (
              <li key={group.title}>
                {!collapsed && (
                  <p className="mb-2 select-none px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                    {group.title}
                  </p>
                )}
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          title={item.label}
                          onClick={onCloseMobile}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors duration-150",
                            active
                              ? "bg-gold/10 text-gold"
                              : "text-subtle hover:bg-card hover:text-ink",
                            collapsed && "lg:justify-center lg:px-0",
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-gold transition-opacity duration-150",
                              active ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <Icon
                            className="size-4.5 shrink-0"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          <span
                            className={cn(
                              "flex-1 truncate",
                              collapsed && "lg:hidden",
                            )}
                          >
                            {item.label}
                          </span>
                          {item.badge && (
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ring-1 ring-inset",
                                item.badgeTone === "danger"
                                  ? "bg-danger/12 text-danger ring-danger/20"
                                  : "bg-gold/12 text-gold ring-gold/20",
                                collapsed && "lg:hidden",
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        {/* Premium upsell */}
        {/* <div className={cn("px-3", collapsed && "lg:px-2")}>
          <div
            className={cn(
              "rounded-xl border border-gold/20 bg-gradient-to-b from-gold/[0.12] to-transparent p-4",
              collapsed && "lg:hidden",
            )}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-gold" strokeWidth={1.75} aria-hidden />
              <p className="text-[12px] font-semibold text-gold">Ironclad Pro</p>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-subtle">
              AI insights, priority support & unlimited staff.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-3 w-full"
            >
              Upgrade plan
            </Button>
          </div>
        </div> */}

        {/* Collapse toggle (desktop only) + theme switch on phones */}
        <div className="flex shrink-0 items-center gap-2 border-t border-line/60 p-3">
          <div className="lg:hidden">
            <ToggleTheme animationType="swipe-down" />
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-[12px] font-medium text-faint transition-colors hover:bg-card hover:text-ink lg:flex"
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <>
                <PanelLeftOpen className="size-4.5 shrink-0" strokeWidth={1.75} aria-hidden />
              </>
            ) : (
              <>
                <PanelLeftClose className="size-4.5 shrink-0" strokeWidth={1.75} aria-hidden />
                <span className="flex-1 text-left">Collapse</span>
                <ChevronLeft className="size-3.5" strokeWidth={1.75} aria-hidden />
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}