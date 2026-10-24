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

/**
 * Put your image in /public and change this path.
 * e.g. /public/gym-bg.png  ->  "/gym-bg.png"
 */
const BG_IMAGE = "/images/workout.webp";

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

// Parent: controls the order. Left text first, then cards one by one.
const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.1,
    },
  },
};

// Heading block items (label -> title)
const textItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// Each card appears one after another
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

  const text = prefersReduced ? reduced : textItem;
  const card = prefersReduced ? reduced : cardItem;

  return (
    <section id="#features" className="relative isolate w-full overflow-hidden bg-lp-canvas text-white">
      {/* Background image */}
      {/* <Image
        src={BG_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-left opacity-90"
      /> */}

      {/* Dark overlays so text stays readable */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/40 via-black/55 to-black/90" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-transparent to-black/70" />

      {/* Top / bottom hairlines */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="mx-auto grid max-w-[1400px] items-center gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] lg:gap-6 lg:py-20"
      >
        {/* ---------- Left: heading ---------- */}
        <div className="max-w-sm">
          <motion.p
            variants={text}
            className="text-xs font-semibold uppercase tracking-wider text-amber-400"
          >
            Powerful Features
          </motion.p>

          <motion.h2
            variants={text}
            className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl"
          >
            Everything you need to run your gym smoothly
          </motion.h2>
        </div>

        {/* ---------- Right: cards grid ---------- */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, description, Icon }) => (
            <motion.article
              key={title}
              variants={card}
              whileHover={prefersReduced ? undefined : { y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-colors hover:border-amber-400/40 hover:bg-white/[0.06]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-400/70 bg-amber-400/5 text-amber-400 transition-colors group-hover:bg-amber-400/15">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>

              <h3 className="mt-5 text-base font-semibold text-white">
                {title}
              </h3>
              <p className="mt-2 max-w-[22ch] text-sm leading-relaxed text-white/60">
                {description}
              </p>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </section>
  );
}