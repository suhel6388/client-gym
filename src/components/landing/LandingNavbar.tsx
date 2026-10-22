"use client";

import { ArrowUpRight, ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DarkGoldLogoHorizontal from "../../../public/logo_hr";
import { cn } from "@/lib/cn";
import { LANDING_NAV } from "./content";

const MENU_ID_PREFIX = "landing-nav-menu";

function menuIdFor(label: string) {
  return `${MENU_ID_PREFIX}-${label.toLowerCase().replace(/\s+/g, "-")}`;
}

export function LandingNavbar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // The landing page is the Features destination, so keep that item lit on "/".
  const activeLabel = pathname === "/" ? "Features" : null;

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!openMenu) return;

    function handlePointerDown(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    function handleResize() {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-lp-nav/95">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-lp-nav/70 backdrop-blur-xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />

      <div className="relative z-10 mx-auto grid h-[72px] max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 sm:h-[76px] sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:px-10 xl:h-[84px] xl:px-12">
        <Link
          href="/"
          aria-label="DarkGoldGym home"
          className="flex min-w-0 shrink-0 items-center justify-self-start rounded-md transition-opacity duration-300 hover:opacity-90"
        >
          <DarkGoldLogoHorizontal className="h-8 w-auto text-white sm:h-9 lg:h-9 xl:h-10" />
        </Link>

        <div ref={navRef} className="hidden h-full items-stretch justify-self-center lg:flex">
          <nav aria-label="Primary" className="flex h-full items-stretch">
            {LANDING_NAV.map((item) => {
              const hasMenu = Boolean(item.children?.length);
              const isOpen = openMenu === item.label;
              const isActive = activeLabel === item.label;
              const menuId = menuIdFor(item.label);

              return (
                <div
                  key={item.label}
                  className="relative flex h-full items-center"
                  onMouseEnter={() => {
                    if (hasMenu) setOpenMenu(item.label);
                  }}
                  onMouseLeave={() => {
                    if (hasMenu) {
                      setOpenMenu((current) =>
                        current === item.label ? null : current,
                      );
                    }
                  }}
                  onBlur={(event) => {
                    if (
                      hasMenu &&
                      !event.currentTarget.contains(event.relatedTarget as Node | null)
                    ) {
                      setOpenMenu((current) =>
                        current === item.label ? null : current,
                      );
                    }
                  }}
                >
                  {hasMenu ? (
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={menuId}
                      aria-current={isActive ? "page" : undefined}
                      data-open={isOpen ? "true" : undefined}
                      onClick={() =>
                        setOpenMenu((current) =>
                          current === item.label ? null : item.label,
                        )
                      }
                      className="dg-nav-link"
                    >
                      <span className="relative z-10 inline-flex items-center gap-1.5">
                        {item.label}
                        <ChevronDown
                          aria-hidden
                          strokeWidth={1.8}
                          className={cn(
                            "size-3 text-current opacity-55 transition-transform duration-300",
                            isOpen && "rotate-180 opacity-80",
                          )}
                        />
                      </span>
                      <span aria-hidden className="dg-nav-glow" />
                      <span aria-hidden className="dg-nav-edge" />
                      <span aria-hidden className="dg-nav-underline" />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className="dg-nav-link"
                    >
                      <span className="relative z-10 inline-flex items-center gap-1.5">
                        {item.label}
                      </span>
                      <span aria-hidden className="dg-nav-glow" />
                      <span aria-hidden className="dg-nav-edge" />
                      <span aria-hidden className="dg-nav-underline" />
                    </Link>
                  )}

                  {hasMenu && isOpen && (
                    <div
                      id={menuId}
                      className="absolute left-1/2 top-full z-50 w-[306px] -translate-x-1/2 pt-3"
                    >
                      <div className="relative overflow-hidden rounded-xl border border-white/[0.09] bg-[#0c0d0e]/98 p-2 shadow-[0_28px_60px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lp-gold/75 to-transparent"
                        />
                        <ul>
                          {item.children?.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <li key={child.label}>
                                <Link
                                  href={child.href}
                                  onClick={() => setOpenMenu(null)}
                                  className="group/menu flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 transition-colors duration-200 hover:bg-lp-gold/[0.065] focus-visible:bg-lp-gold/[0.065]"
                                >
                                  <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-lp-gold/15 bg-lp-gold/[0.07] text-lp-gold transition-colors duration-200 group-hover/menu:border-lp-gold/25 group-hover/menu:text-lp-gold-highlight">
                                    <ChildIcon
                                      aria-hidden
                                      className="size-3.5"
                                      strokeWidth={1.8}
                                    />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-[12.5px] font-medium leading-5 text-lp-ink transition-colors group-hover/menu:text-lp-gold-highlight">
                                      {child.label}
                                    </span>
                                    <span className="mt-0.5 block text-[10.5px] leading-4 text-lp-muted/75">
                                      {child.description}
                                    </span>
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 justify-self-end sm:gap-2.5">
          <Link
            href="/login"
            className="hidden h-10 items-center justify-center whitespace-nowrap rounded-lg border border-white/[0.14] bg-white/[0.02] px-4 text-[12.5px] font-semibold text-lp-ink transition-colors duration-300 hover:border-lp-gold/45 hover:bg-lp-gold/[0.06] hover:text-lp-gold-highlight md:inline-flex"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="hidden h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[linear-gradient(135deg,#FFD15C_0%,#F5B323_55%,#EFAE14_100%)] px-4 text-[12.5px] font-bold text-[#171203] shadow-[0_8px_24px_-10px_rgba(245,179,35,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-10px_rgba(245,179,35,0.85)] sm:inline-flex"
          >
            Start Free Trial
            <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={2.2} />
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex size-10 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-lp-ink transition-colors duration-300 hover:border-lp-gold/40 hover:text-lp-gold focus-visible:border-lp-gold lg:hidden"
          >
            {mobileOpen ? (
              <X aria-hidden className="size-4.5" strokeWidth={1.9} />
            ) : (
              <Menu aria-hidden className="size-4.5" strokeWidth={1.9} />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 top-[72px] z-40 bg-black/70 backdrop-blur-[2px] sm:top-[76px] lg:hidden"
          />
          <div
            id="landing-mobile-menu"
            className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-white/[0.09] bg-lp-nav shadow-[0_28px_70px_rgba(0,0,0,0.82)] lg:hidden"
          >
            <nav
              aria-label="Mobile navigation"
              className="mx-auto max-w-[1440px] px-5 pb-5 pt-2 sm:px-8"
            >
              <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-lp-muted/55">
                Menu
              </p>
              <ul className="space-y-0.5">
                {LANDING_NAV.map((item) => {
                  const isActive = activeLabel === item.label;
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-3 text-[14px] font-medium transition-colors duration-200",
                          isActive
                            ? "bg-lp-gold/[0.08] text-lp-gold"
                            : "text-lp-muted hover:bg-white/[0.04] hover:text-lp-ink",
                        )}
                      >
                        {item.label}
                        <ChevronRight
                          aria-hidden
                          className="size-4 opacity-45"
                          strokeWidth={1.8}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 grid gap-2.5 border-t border-white/[0.08] pt-4">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-white/[0.14] bg-white/[0.02] text-[13px] font-semibold text-lp-ink transition-colors hover:border-lp-gold/45 hover:text-lp-gold-highlight"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#FFD15C_0%,#F5B323_55%,#EFAE14_100%)] text-[13px] font-bold text-[#171203] shadow-[0_10px_26px_-12px_rgba(245,179,35,0.8)]"
                >
                  Start Free Trial
                  <ArrowUpRight aria-hidden className="size-4" strokeWidth={2.2} />
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
