"use client";

import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  UserRound,
  CalendarCheck,
  Wallet,
  Dumbbell,
  BarChart3,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Workout photography lives in /public/images. */
const FEATURE_IMAGE = "/images/workout.webp";

type Feature = {
  title: string;
  description: string;
  Icon: LucideIcon;
};

const FEATURES: Feature[] = [
  {
    title: "Member Management",
    description: "Add, manage & track all member details in one place.",
    Icon: UserRound,
  },
  {
    title: "Attendance Tracking",
    description: "Easy check-in system and attendance reports.",
    Icon: CalendarCheck,
  },
  {
    title: "Payment Management",
    description: "Collect payments, track dues & generate invoices.",
    Icon: Wallet,
  },
  {
    title: "Workout & Diet Plans",
    description: "Create and assign workout & diet plans for members.",
    Icon: Dumbbell,
  },
  {
    title: "Reports & Analytics",
    description: "Detailed reports to understand your gym performance.",
    Icon: BarChart3,
  },
  {
    title: "Multi-user Access",
    description: "Add staff, trainers and manage roles with ease.",
    Icon: Users,
  },
];

/* ---------- Animation variants ---------- */

// Parent: controls the order. Left visual first, then cards one by one.
const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const visualItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

// Reduced-motion fallback: just fade, no movement
const reduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

export default function GymFeatures() {
  const prefersReduced = useReducedMotion();

  const visual = prefersReduced ? reduced : visualItem;
  const card = prefersReduced ? reduced : cardItem;

  return (
    <section
      id="features"
      className="dg-lp-section relative isolate w-full overflow-hidden text-lp-ink"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/4 -z-10 size-[440px] rounded-full bg-lp-gold/[0.05] blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 -z-10 size-[420px] rounded-full bg-lp-gold/[0.045] blur-[120px]"
      />

      {/* Top / bottom hairlines */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-lp-line/40" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-lp-line/30" />

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto grid max-w-[1400px] items-stretch gap-6 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.55fr)] lg:gap-8 lg:px-10 lg:py-24"
      >
        {/* ---------- Left: workout image with the heading blended in ---------- */}
        <motion.div
          variants={visual}
          className="group relative min-h-[420px] overflow-hidden rounded-2xl border border-lp-gold/20 bg-lp-card shadow-[0_30px_70px_-34px_rgba(0,0,0,0.95),0_0_50px_-30px_rgba(245,179,35,0.5)] sm:min-h-[480px] lg:min-h-full"
        >
          <Image
            src={FEATURE_IMAGE}
            alt="Athlete preparing a barbell lift in a dark gym"
            fill
            unoptimized
            sizes="(min-width: 1024px) 36vw, 100vw"
            className="dg-feature-image object-cover object-[52%_center] transition-transform duration-700 ease-out group-hover:scale-[1.045]"
          />

          {/* Blend the neon photo into the black-and-gold surface. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-lp-canvas via-lp-canvas/60 to-transparent"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(120%_90%_at_18%_8%,rgba(245,179,35,0.16),transparent_58%)] mix-blend-soft-light"
          />
          <div
            aria-hidden
            className="absolute inset-0 hidden bg-gradient-to-r from-transparent via-lp-canvas/10 to-lp-canvas/80 lg:block"
          />
          <div
            aria-hidden
            className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lp-gold/70 to-transparent"
          />

          <div className="relative z-10 flex h-full min-h-[420px] flex-col justify-end p-6 sm:min-h-[480px] sm:p-8 lg:min-h-full">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-lp-gold/25 bg-lp-canvas/60 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-lp-gold-highlight backdrop-blur-sm">
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-lp-gold shadow-[0_0_10px_rgba(245,179,35,0.9)]"
              />
              Powerful Features
            </p>

            <h2 className="mt-4 max-w-[17ch] text-balance text-3xl font-semibold leading-tight tracking-[-0.02em] text-lp-ink sm:text-4xl">
              Everything you need to run your gym smoothly
            </h2>

            <span
              aria-hidden
              className="mt-6 block h-px w-20 bg-gradient-to-r from-lp-gold via-lp-gold/40 to-transparent"
            />
          </div>
        </motion.div>

        {/* ---------- Right: feature cards ---------- */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map(({ title, description, Icon }) => (
            <motion.article
              key={title}
              variants={card}
              whileHover={prefersReduced ? undefined : { y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-lp-line bg-lp-card/70 p-5 backdrop-blur-sm transition-all duration-300 hover:border-lp-gold/35 hover:bg-lp-gold/[0.045] hover:shadow-[0_20px_44px_-30px_rgba(245,179,35,0.55)]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-lp-gold/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />

              <div className="flex size-11 items-center justify-center rounded-full border border-lp-gold/45 bg-lp-gold/[0.06] text-lp-gold transition-all duration-300 group-hover:border-lp-gold/70 group-hover:bg-lp-gold/[0.13] group-hover:shadow-[0_0_22px_-8px_rgba(245,179,35,0.8)]">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </div>

              <h3 className="mt-5 text-base font-semibold text-lp-ink">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-lp-muted/85">
                {description}
              </p>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
