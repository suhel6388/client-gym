"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { IconType } from "react-icons";
import { FaFacebookF, FaInstagram, FaYoutube, FaLinkedinIn } from "react-icons/fa";
import DarkGoldLogoHorizontal from "../../../public/logo_hr";

const BRAND = "DarkGold Gym";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Updates", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#about" },
      { label: "Contact Us", href: "#contact" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
];

// TODO: put your real social profile links here
const SOCIALS: { label: string; href: string; Icon: IconType }[] = [
  { label: "Facebook", href: "#", Icon: FaFacebookF },
  { label: "Instagram", href: "#", Icon: FaInstagram },
  { label: "YouTube", href: "#", Icon: FaYoutube },
  { label: "LinkedIn", href: "#", Icon: FaLinkedinIn },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};
const reduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

export default function GymFooter() {
  const prefersReduced = useReducedMotion();
  const v = prefersReduced ? reduced : item;

  return (
    <footer className="dg-lp-section relative w-full overflow-hidden text-lp-ink">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-lp-line/40" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-0 size-[340px] rounded-full bg-lp-gold/[0.05] blur-[110px]"
      />

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="relative mx-auto grid max-w-[1200px] gap-10 px-6 py-12 sm:grid-cols-2 sm:px-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]"
      >
        {/* Brand */}
        <motion.div variants={v}>
          <a
            href="#home"
            aria-label={`${BRAND} home`}
            className="inline-block rounded-md transition-opacity duration-300 hover:opacity-90"
          >
            <DarkGoldLogoHorizontal className="h-12 w-auto" aria-hidden="true" />
          </a>
          <p className="mt-4 max-w-[220px] text-xs leading-relaxed text-lp-muted/80">
            All-in-one Gym Management Software to help you manage, grow and succeed.
          </p>
        </motion.div>

        {/* Link columns */}
        {COLUMNS.map((col) => (
          <motion.nav key={col.title} variants={v} aria-label={col.title}>
            <h4 className="text-sm font-medium text-lp-ink">{col.title}</h4>
            <ul className="mt-4 space-y-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-xs text-lp-muted/80 transition-colors duration-200 hover:text-lp-gold-highlight"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>
        ))}

        {/* Social */}
        <motion.div variants={v}>
          <h4 className="text-sm font-medium text-lp-ink">Follow Us</h4>
          <div className="mt-4 flex gap-3">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-full border border-lp-line text-lp-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-lp-gold/60 hover:bg-lp-gold/[0.07] hover:text-lp-gold-highlight hover:shadow-[0_0_22px_-8px_rgba(245,179,35,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-highlight"
              >
                <Icon className="size-4" aria-hidden />
              </a>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <div className="relative border-t border-lp-line/30 py-4 text-center text-xs text-lp-muted/60">
        &copy; {new Date().getFullYear()} {BRAND}. All rights reserved.
      </div>
    </footer>
  );
}
