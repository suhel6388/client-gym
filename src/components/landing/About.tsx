"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Dumbbell,
  Zap,
  ShieldCheck,
  Rocket,
  type LucideIcon,
} from "lucide-react";

/* ---------- Content (edit freely) ---------- */

const BRAND = "YourGymApp"; // <- change to your product name

const STORY = [
  `${BRAND} started with a simple problem: gym owners were spending more time on registers, WhatsApp reminders and payment follow-ups than on their members.`,
  "We built one place to manage members, attendance, payments and workout plans, so owners and trainers can focus on coaching and growing the gym.",
];

type Value = { title: string; description: string; Icon: LucideIcon };

const VALUES: Value[] = [
  {
    title: "Built for gym owners",
    description: "Every feature comes from how gyms actually run day to day.",
    Icon: Dumbbell,
  },
  {
    title: "Simple to use",
    description: "Staff can learn it in minutes, with no training needed.",
    Icon: Zap,
  },
  {
    title: "Reliable & secure",
    description: "Your member and payment data stays safe and backed up.",
    Icon: ShieldCheck,
  },
  {
    title: "Always improving",
    description: "We ship new features based on feedback from our gyms.",
    Icon: Rocket,
  },
];

// TODO: replace with your real numbers before launch
const STATS = [
  { value: "100+", label: "Gyms onboarded" },
  { value: "10,000+", label: "Members managed" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

/* ---------- Animation variants ---------- */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
};

const textItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
};

const statItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

const reduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

/* ---------- Component ---------- */

export default function GymAbout() {
  const prefersReduced = useReducedMotion();

  const text = prefersReduced ? reduced : textItem;
  const card = prefersReduced ? reduced : cardItem;
  const stat = prefersReduced ? reduced : statItem;

  return (
    <section
      id="about"
      className="relative isolate w-full overflow-hidden bg-[#070707] text-white"
    >
      <div className="pointer-events-none absolute -left-40 top-1/3 -z-10 h-[420px] w-[520px] rounded-full bg-amber-500/[0.06] blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-[1200px] px-6 py-16 sm:px-10 lg:py-20"
      >
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ---------- Left: story ---------- */}
          <div>
            <motion.p
              variants={text}
              className="text-xs font-semibold uppercase tracking-wider text-amber-400"
            >
              About Us
            </motion.p>

            <motion.h2
              variants={text}
              className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl"
            >
              We help gyms spend less time on admin and more on their members
            </motion.h2>

            {STORY.map((p, i) => (
              <motion.p
                key={i}
                variants={text}
                className="mt-5 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base"
              >
                {p}
              </motion.p>
            ))}

            <motion.div variants={text} className="mt-8 flex flex-wrap gap-3">
              <a
                href="#pricing"
                className="rounded-md bg-gradient-to-b from-amber-300 to-amber-500 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                Start Free Trial
              </a>
              <a
                href="#contact"
                className="rounded-md border border-amber-400 px-6 py-3 text-sm font-semibold text-amber-400 transition hover:bg-amber-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                Talk to Us
              </a>
            </motion.div>
          </div>

          {/* ---------- Right: value cards ---------- */}
          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map(({ title, description, Icon }) => (
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
                <h3 className="mt-5 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  {description}
                </p>
              </motion.article>
            ))}
          </div>
        </div>

        {/* ---------- Stats strip ---------- */}
        <div className="mt-14 grid grid-cols-2 gap-y-8 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-8 lg:grid-cols-4">
          {STATS.map(({ value, label }, i) => (
            <motion.div
              key={label}
              variants={stat}
              className={`text-center ${
                i !== 0 ? "lg:border-l lg:border-white/10" : ""
              }`}
            >
              <p className="text-3xl font-semibold text-amber-400">{value}</p>
              <p className="mt-1 text-xs text-white/60 sm:text-sm">{label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}