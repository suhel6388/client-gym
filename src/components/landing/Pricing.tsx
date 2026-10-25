"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Check,
  TimerReset,
  Lock,
  Headphones,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";

/* ---------- Data ---------- */

type Plan = {
  name: string;
  price: string;
  period: string;
  note: string; // "Billed monthly" or "Save ₹100"
  noteHighlight?: string; // the amber part of the note, e.g. "₹100"
  features: string[];
  popular?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Monthly",
    price: "₹499",
    period: "/month",
    note: "Billed monthly",
    features: [
      "All Core Features",
      "Member Management",
      "Attendance Tracking",
      "Payment Management",
      "Email Support",
    ],
  },
  {
    name: "Quarterly",
    price: "₹1,399",
    period: "/3 months",
    note: "Save ",
    noteHighlight: "₹100",
    features: [
      "All Core Features",
      "Member Management",
      "Attendance Tracking",
      "Payment Management",
      "Email Support",
      "Priority Support",
    ],
  },
  {
    name: "Half-Yearly",
    price: "₹2,799",
    period: "/6 months",
    note: "Save ",
    noteHighlight: "₹389",
    popular: true,
    features: [
      "All Core Features",
      "Member Management",
      "Attendance Tracking",
      "Payment Management",
      "Priority Support",
      "Advanced Reports",
    ],
  },
  {
    name: "Annual",
    price: "₹4,699",
    period: "/year",
    note: "Save ",
    noteHighlight: "₹1,289",
    features: [
      "All Core Features",
      "Member Management",
      "Attendance Tracking",
      "Payment Management",
      "Priority Support",
      "Advanced Reports",
      "WhatsApp Support",
    ],
  },
];

type Trust = { title: string; subtitle: string; Icon: LucideIcon };

const TRUST: Trust[] = [
  { title: "Cancel Anytime", subtitle: "No questions asked", Icon: TimerReset },
  { title: "Secure Payments", subtitle: "100% secure & trusted", Icon: Lock },
  { title: "24/7 Support", subtitle: "We're here to help", Icon: Headphones },
  { title: "Regular Updates", subtitle: "New features added", Icon: Lightbulb },
];

/* ---------- Animation variants ---------- */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const textItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE } },
};

const trustItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

const reduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

const PRIMARY_BUTTON =
  "bg-[linear-gradient(135deg,#FFD15C_0%,#F5B323_55%,#EFAE14_100%)] text-[#171203] shadow-[0_12px_28px_-14px_rgba(245,179,35,0.75)] hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-12px_rgba(245,179,35,0.9)]";

/* ---------- Component ---------- */

export default function GymPricing() {
  const prefersReduced = useReducedMotion();

  const text = prefersReduced ? reduced : textItem;
  const card = prefersReduced ? reduced : cardItem;
  const trust = prefersReduced ? reduced : trustItem;

  return (
    <section
      id="pricing"
      className="dg-lp-section relative isolate w-full overflow-hidden text-lp-ink"
    >
      {/* Soft amber glow behind the popular plan */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lp-gold/[0.06] blur-3xl"
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
        {/* ---------- Heading ---------- */}
        <div className="text-center">
          <motion.p
            variants={text}
            className="text-xs font-semibold uppercase tracking-wider text-lp-gold"
          >
            Simple &amp; Transparent Pricing
          </motion.p>

          <motion.h2
            variants={text}
            className="mt-3 text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-4xl"
          >
            Choose the plan that&apos;s right for you
          </motion.h2>

          <motion.p variants={text} className="mt-3 text-sm text-lp-muted">
            14-Day Free Trial on All Plans. No Credit Card Required.
          </motion.p>
        </div>

        {/* ---------- Plans ---------- */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <motion.article
              key={plan.name}
              variants={card}
              whileHover={prefersReduced ? undefined : { y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className={`relative flex flex-col rounded-xl border p-6 backdrop-blur-sm transition-colors duration-300 ${
                plan.popular
                  ? "border-lp-gold/65 bg-lp-gold/[0.055] shadow-[0_0_46px_-16px_rgba(245,179,35,0.55)]"
                  : "border-white/[0.07] bg-white/[0.025] hover:border-lp-gold/35 hover:bg-lp-gold/[0.035]"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-lp-gold/70 bg-lp-card px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-lp-gold-highlight shadow-[0_0_20px_-8px_rgba(245,179,35,0.8)]">
                  Most Popular
                </span>
              )}

              <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-lp-gold">
                {plan.name}
              </h3>

              <p className="mt-4 text-center">
                <span className="text-4xl font-semibold text-lp-ink">
                  {plan.price}
                </span>{" "}
                <span className="text-sm text-lp-muted">{plan.period}</span>
              </p>

              <p className="mt-2 text-center text-xs text-lp-muted/80">
                {plan.note}
                {plan.noteHighlight && (
                  <span className="font-semibold text-lp-gold">
                    {plan.noteHighlight}
                  </span>
                )}
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-sm text-lp-ink/85"
                  >
                    <Check
                      className="size-4 shrink-0 text-lp-gold"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`mt-8 w-full rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-highlight ${
                  plan.popular
                    ? PRIMARY_BUTTON
                    : "border border-lp-gold/45 text-lp-gold-highlight hover:-translate-y-0.5 hover:border-lp-gold/80 hover:bg-lp-gold/[0.08]"
                }`}
              >
                Start Free Trial
              </button>
            </motion.article>
          ))}
        </div>

        {/* ---------- Trust row ---------- */}
        <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-0">
          {TRUST.map(({ title, subtitle, Icon }, i) => (
            <motion.div
              key={title}
              variants={trust}
              className={`flex items-center justify-center gap-3 lg:px-4 ${
                i !== 0 ? "lg:border-l lg:border-lp-line/40" : ""
              }`}
            >
              <Icon
                className="size-7 shrink-0 text-lp-gold"
                strokeWidth={1.5}
                aria-hidden
              />
              <div>
                <p className="text-sm font-semibold text-lp-ink">{title}</p>
                <p className="text-xs text-lp-muted/75">{subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
