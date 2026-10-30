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

const BRAND = "DarkGoldGym";

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
      className="dg-lp-section relative isolate w-full overflow-hidden text-lp-ink"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/3 -z-10 h-[420px] w-[520px] rounded-full bg-lp-gold/[0.055] blur-3xl"
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-lp-line/40" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-lp-line/30" />

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
              className="text-xs font-semibold uppercase tracking-wider text-lp-gold"
            >
              About Us
            </motion.p>

            <motion.h2
              variants={text}
              className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl"
            >
              We help gyms spend less time on admin and more on their members
            </motion.h2>

            {STORY.map((p, i) => (
              <motion.p
                key={i}
                variants={text}
                className="mt-5 max-w-lg text-sm leading-relaxed text-lp-muted sm:text-base"
              >
                {p}
              </motion.p>
            ))}

            <motion.div variants={text} className="mt-8 flex flex-wrap gap-3">
              <a
                href="#pricing"
                className="rounded-lg bg-[linear-gradient(135deg,#FFD15C_0%,#F5B323_55%,#EFAE14_100%)] px-6 py-3 text-sm font-semibold text-[#171203] shadow-[0_12px_28px_-14px_rgba(245,179,35,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-12px_rgba(245,179,35,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-highlight"
              >
                Start Free Trial
              </a>
              <a
                href="#contact"
                className="rounded-lg border border-lp-gold/45 px-6 py-3 text-sm font-semibold text-lp-gold-highlight transition-all duration-300 hover:-translate-y-0.5 hover:border-lp-gold/80 hover:bg-lp-gold/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-highlight"
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
                className="group rounded-xl border border-lp-line bg-lp-card/70 p-5 backdrop-blur-sm transition-all duration-300 hover:border-lp-gold/35 hover:bg-lp-gold/[0.045] hover:shadow-[0_20px_44px_-30px_rgba(245,179,35,0.55)]"
              >
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
        </div>

        {/* ---------- Stats strip ---------- */}
        <div className="mt-14 grid grid-cols-2 gap-y-8 rounded-xl border border-lp-line bg-lp-card/70 px-4 py-8 lg:grid-cols-4">
          {STATS.map(({ value, label }, i) => (
            <motion.div
              key={label}
              variants={stat}
              className={`text-center ${
                i !== 0 ? "lg:border-l lg:border-lp-line/40" : ""
              }`}
            >
              <p className="text-3xl font-semibold text-lp-gold">{value}</p>
              <p className="mt-1 text-xs text-lp-muted/80 sm:text-sm">{label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
