"use client";

import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { IconType } from "react-icons";
import { FaFacebookF, FaInstagram, FaYoutube, FaLinkedinIn } from "react-icons/fa";
import DarkGoldLogoHorizontal from "../../../out/logo_hr";

/**
 * Logo: copy E:\gym-public\logo_hr.svg into your project's /public folder,
 * then it is served at "/logo_hr.svg".
 */
const LOGO_SRC = "/logo_hr.svg";
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
    <footer className="w-full border-t border-white/10 bg-[#070707] text-white">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto grid max-w-[1200px] gap-10 px-6 py-12 sm:grid-cols-2 sm:px-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]"
      >
        {/* Brand */}
        <motion.div variants={v}>
          <a href="#" aria-label={`${BRAND} home`} className="inline-block">
         <DarkGoldLogoHorizontal className="h-12 w-auto" aria-hidden="true" />
          </a>
          <p className="mt-4 max-w-[220px] text-xs leading-relaxed text-white/60">
            All-in-one Gym Management Software to help you manage, grow and succeed.
          </p>
        </motion.div>

        {/* Link columns */}
        {COLUMNS.map((col) => (
          <motion.nav key={col.title} variants={v} aria-label={col.title}>
            <h4 className="text-sm font-medium text-white/80">{col.title}</h4>
            <ul className="mt-4 space-y-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-xs text-white/60 transition hover:text-amber-400"
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
          <h4 className="text-sm font-medium text-white/80">Follow Us</h4>
          <div className="mt-4 flex gap-3">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-amber-400 hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
        &copy; {new Date().getFullYear()} {BRAND}. All rights reserved.
      </div>
    </footer>
  );
}