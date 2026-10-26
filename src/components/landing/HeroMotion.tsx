"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Client-side motion primitives for the hero. `HeroSection` and `HeroVisual`
 * stay server components (the latter reads the filesystem), so they compose
 * these wrappers instead of turning the whole hero into a client bundle.
 */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Top-level hero grid: copy column first, product preview second. */
const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.1 } },
};

/** Copy column: badge → headline → description → features → CTAs → trust. */
const column: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
};

const listItem: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: EASE },
  },
};

const visual: Variants = {
  hidden: { opacity: 0, y: 34, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.85, ease: EASE },
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35 } },
};

/** Wrappers stay inert; only the leaf items animate in reduced-motion mode. */
const noStagger: Variants = { hidden: {}, show: {} };

type BaseProps = {
  className?: string;
  children: ReactNode;
};

/** Root stagger container for the hero grid. */
export function HeroReveal({ className, children }: BaseProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={reduced ? noStagger : grid}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

/** Nested stagger container for the marketing copy. */
export function HeroColumn({ className, children }: BaseProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div className={className} variants={reduced ? noStagger : column}>
      {children}
    </motion.div>
  );
}

/** A single element that appears in sequence. */
export function HeroItem({ className, children }: BaseProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div className={className} variants={reduced ? fadeIn : item}>
      {children}
    </motion.div>
  );
}

/** List container that staggers its own children. */
export function HeroList({ className, children }: BaseProps) {
  const reduced = useReducedMotion();

  return (
    <motion.ul className={className} variants={reduced ? noStagger : list}>
      {children}
    </motion.ul>
  );
}

/** Individual list entry (feature highlight or trust indicator). */
export function HeroListItem({
  id,
  className,
  children,
}: BaseProps & { id?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.li
      id={id}
      className={className}
      variants={reduced ? fadeIn : listItem}
    >
      {children}
    </motion.li>
  );
}

/** Product preview: slides in last, after the copy has settled. */
export function HeroVisualReveal({ className, children }: BaseProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div className={className} variants={reduced ? fadeIn : visual}>
      {children}
    </motion.div>
  );
}
