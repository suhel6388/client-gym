"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { ArrowUpRight, ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import DarkGoldLogoHorizontal from "../../../public/logo_hr";
import { ToggleTheme } from "@/components/lightswind/toggle-theme";
import { cn } from "@/lib/cn";
import { LANDING_NAV } from "./navigation";

const MENU_ID_PREFIX = "landing-nav-menu";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Nav links appear left to right shortly after the bar slides in. */
const navContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.22 } },
};

const navItem: Variants = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

const noStagger: Variants = { hidden: {}, show: {} };

// Every in-page anchor on the landing route. Only sections that appear in the
// navbar drive the highlight, so the last nav section stays lit through the
// contact, testimonial and CTA sections instead of going dark.
const NAV_SECTION_IDS = LANDING_NAV.flatMap((item) => {
  const hash = hashFor(item.href);
  return hash ? [hash] : [];
});

function menuIdFor(label: string) {
  return `${MENU_ID_PREFIX}-${label.toLowerCase().replace(/\s+/g, "-")}`;
}

/** Extract the hash from links such as "/#features" or "#pricing". */
function hashFor(href: string) {
  const index = href.indexOf("#");
  return index >= 0 ? href.slice(index + 1) : null;
}

export function LandingNavbar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Highlight the link for the section currently crossing the navbar line.
  const activeLabel =
    pathname === "/"
      ? (LANDING_NAV.find((item) => hashFor(item.href) === activeSection)
          ?.label ?? null)
      : (LANDING_NAV.find((item) => item.href === pathname)?.label ?? null);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  // Scroll spy: pick the last section whose top has passed the navbar offset.
  // Cheaper and more predictable than IntersectionObserver for long, nested
  // sections such as the hero's solution preview.
  useEffect(() => {
    if (pathname !== "/") return;

    let frame = 0;

    const update = () => {
      frame = 0;
      // Just below the sticky navbar, but above the scroll-padding offset so
      // an anchor click immediately lights its own link.
      const marker = window.scrollY + (window.innerWidth >= 1280 ? 112 : 92);
      let current = "home";

      // Sort by document position: the nav order and page order differ because
      // "Solutions" points inside the hero. The lowest section past the marker
      // wins.
      const sections = NAV_SECTION_IDS.map((id) => document.getElementById(id))
        .filter((element): element is HTMLElement => Boolean(element))
        .sort(
          (a, b) =>
            a.getBoundingClientRect().top - b.getBoundingClientRect().top,
        );

      for (const element of sections) {
        const top = element.getBoundingClientRect().top + window.scrollY;
        if (top <= marker) current = element.id;
      }

      setActiveSection(current);
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
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
      if (window.innerWidth >= 1280) setMobileOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [mobileOpen]);

  /**
   * Smooth-scroll in-page anchors instead of letting the router jump. Keeps
   * the URL shareable and immediately reflects the chosen section.
   */
  function handleAnchorNavigation(
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    const hash = hashFor(href);
    if (!hash || pathname !== "/") return;

    const target = document.getElementById(hash);
    if (!target) return;

    event.preventDefault();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });

    if (window.location.hash !== `#${hash}`) {
      window.history.replaceState(null, "", `#${hash}`);
    }

    setActiveSection(hash);
    setOpenMenu(null);
    setMobileOpen(false);
  }

  return (
    <motion.header
      initial={prefersReduced ? { opacity: 0 } : { y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: prefersReduced ? 0.3 : 0.55,
        ease: EASE,
      }}
      className="sticky top-0 z-50 border-b border-lp-gold/10 bg-lp-nav/95"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-lp-nav/90 backdrop-blur-xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lp-gold/25 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-lp-gold/20 to-transparent"
      />

      <div className="relative z-10 mx-auto grid h-[72px] max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 sm:h-[76px] sm:px-8 lg:px-10 xl:h-[84px] xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:px-12">
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReduced ? 0.3 : 0.5,
            ease: EASE,
            delay: 0.1,
          }}
          className="flex min-w-0 shrink-0 justify-self-start"
        >
          <Link
            href="/"
            aria-label="DarkGoldGym home"
            className="flex min-w-0 shrink-0 items-center rounded-md transition-opacity duration-300 hover:opacity-90"
          >
            <DarkGoldLogoHorizontal className="h-8 w-auto text-lp-ink sm:h-9 lg:h-9 xl:h-10" />
          </Link>
        </motion.div>

        <div
          ref={navRef}
          className="hidden h-full items-stretch justify-self-center xl:flex"
        >
          <motion.nav
            aria-label="Primary"
            className="flex h-full items-stretch"
            variants={prefersReduced ? noStagger : navContainer}
            initial="hidden"
            animate="show"
          >
            {LANDING_NAV.map((item) => {
              const hasMenu = Boolean(item.children?.length);
              const isOpen = openMenu === item.label;
              const isActive = activeLabel === item.label;
              const menuId = menuIdFor(item.label);

              return (
                <motion.div
                  key={item.label}
                  variants={prefersReduced ? fadeIn : navItem}
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
                      !event.currentTarget.contains(
                        event.relatedTarget as Node | null,
                      )
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
                      <span aria-hidden className="dg-nav-bg" />
                      <span aria-hidden className="dg-nav-glow" />
                      <span aria-hidden className="dg-nav-edge" />
                      <span aria-hidden className="dg-nav-underline" />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={(event) =>
                        handleAnchorNavigation(event, item.href)
                      }
                      className="dg-nav-link"
                    >
                      <span className="relative z-10 inline-flex items-center gap-1.5">
                        {item.label}
                      </span>
                      <span aria-hidden className="dg-nav-bg" />
                      <span aria-hidden className="dg-nav-glow" />
                      <span aria-hidden className="dg-nav-edge" />
                      <span aria-hidden className="dg-nav-underline" />
                    </Link>
                  )}

                  {hasMenu && (
                    <div
                      id={menuId}
                      className="absolute left-1/2 top-full z-50 w-[306px] -translate-x-1/2 pt-3"
                    >
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={
                              prefersReduced
                                ? { opacity: 0 }
                                : { opacity: 0, y: -8, scale: 0.98 }
                            }
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={
                              prefersReduced
                                ? { opacity: 0 }
                                : { opacity: 0, y: -8, scale: 0.98 }
                            }
                            transition={{ duration: 0.18, ease: EASE }}
                            className="relative overflow-hidden rounded-xl border border-lp-gold/20 bg-lp-card/98 p-2 shadow-[0_28px_60px_-18px_rgba(0,0,0,0.9),0_0_40px_-24px_rgba(245,179,35,0.55)] backdrop-blur-xl"
                          >
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
                                      onClick={(event) => {
                                        handleAnchorNavigation(
                                          event,
                                          child.href,
                                        );
                                        setOpenMenu(null);
                                      }}
                                      className="group/menu flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 transition-colors duration-200 hover:bg-lp-gold/[0.075] focus-visible:bg-lp-gold/[0.075]"
                                    >
                                      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-lp-gold/15 bg-lp-gold/[0.07] text-lp-gold transition-colors duration-200 group-hover/menu:border-lp-gold/30 group-hover/menu:bg-lp-gold/[0.12] group-hover/menu:text-lp-gold-highlight">
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.nav>
        </div>

        <motion.div
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReduced ? 0.3 : 0.45,
            ease: EASE,
            delay: 0.38,
          }}
          className="flex items-center gap-2 justify-self-end sm:gap-2.5"
        >
          <ToggleTheme animationType="swipe-down" />
          <Link
            href="/login"
            className="hidden h-10 items-center justify-center whitespace-nowrap rounded-lg border border-lp-line bg-lp-ink/[0.02] px-4 text-[12.5px] font-semibold text-lp-ink transition-all duration-300 hover:border-lp-gold/45 hover:bg-lp-gold/[0.06] hover:text-lp-gold-highlight hover:shadow-[0_0_22px_-10px_rgba(245,179,35,0.75)] md:inline-flex"
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
            aria-label={
              mobileOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex size-10 items-center justify-center rounded-lg border border-lp-line bg-lp-card text-lp-ink transition-all duration-300 hover:border-lp-gold/40 hover:bg-lp-gold/[0.06] hover:text-lp-gold-highlight hover:shadow-[0_0_22px_-10px_rgba(245,179,35,0.75)] focus-visible:border-lp-gold active:scale-95 xl:hidden"
          >
            {mobileOpen ? (
              <X aria-hidden className="size-4.5" strokeWidth={1.9} />
            ) : (
              <Menu aria-hidden className="size-4.5" strokeWidth={1.9} />
            )}
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="landing-mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <button
              type="button"
              tabIndex={-1}
              aria-label="Close navigation menu"
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 top-[72px] z-40 bg-black/70 backdrop-blur-[2px] sm:top-[76px] xl:hidden"
            />
            <motion.div
              id="landing-mobile-menu"
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReduced ? 0.25 : 0.3,
                ease: EASE,
              }}
              className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-lp-gold/15 bg-lp-nav shadow-[0_28px_70px_rgba(0,0,0,0.82)] xl:hidden"
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
                          onClick={(event) => {
                            handleAnchorNavigation(event, item.href);
                            setMobileOpen(false);
                          }}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "flex items-center justify-between rounded-lg border px-3 py-3 text-[14px] font-medium transition-all duration-300",
                            isActive
                              ? "border-lp-gold/25 bg-lp-gold/[0.08] text-lp-gold-highlight shadow-[inset_0_0_20px_-10px_rgba(245,179,35,0.7)]"
                              : "border-transparent text-lp-muted hover:border-lp-gold/15 hover:bg-lp-gold/[0.06] hover:text-lp-ink active:bg-lp-gold/[0.06]",
                          )}
                        >
                          <span className="inline-flex items-center gap-2.5">
                            <span
                              aria-hidden
                              className={cn(
                                "size-1.5 rounded-full bg-lp-gold transition-opacity duration-300",
                                isActive
                                  ? "opacity-100 shadow-[0_0_8px_rgba(245,179,35,0.9)]"
                                  : "opacity-0",
                              )}
                            />
                            {item.label}
                          </span>
                          <ChevronRight
                            aria-hidden
                            className={cn(
                              "size-4 transition-colors",
                              isActive ? "text-lp-gold" : "opacity-45",
                            )}
                            strokeWidth={1.8}
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-4 grid gap-2.5 border-t border-lp-gold/15 pt-4">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-lp-line bg-lp-ink/[0.02] text-[13px] font-semibold text-lp-ink transition-all duration-300 hover:border-lp-gold/45 hover:bg-lp-gold/[0.06] hover:text-lp-gold-highlight"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#FFD15C_0%,#F5B323_55%,#EFAE14_100%)] text-[13px] font-bold text-[#171203] shadow-[0_10px_26px_-12px_rgba(245,179,35,0.8)]"
                  >
                    Start Free Trial
                    <ArrowUpRight
                      aria-hidden
                      className="size-4"
                      strokeWidth={2.2}
                    />
                  </Link>
                </div>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
