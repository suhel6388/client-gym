"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Trophy, ArrowRight } from "lucide-react";

export default function GymReward() {
  const prefersReduced = useReducedMotion();

  return (
    <section
      id="reward"
      className="dg-lp-section relative isolate w-full overflow-hidden px-6 pb-16 text-lp-ink sm:px-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[280px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lp-gold/[0.07] blur-[110px]"
      />

      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="dg-dark-preview relative mx-auto flex max-w-[1200px] flex-col items-center gap-6 overflow-hidden rounded-2xl border border-lp-gold/45 bg-[linear-gradient(135deg,rgba(245,179,35,0.09),rgba(16,17,18,0.9)_46%,rgba(7,6,4,0.96))] px-6 py-8 text-center shadow-[0_0_50px_-20px_rgba(245,179,35,0.55)] md:flex-row md:justify-between md:px-12 md:text-left"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-lp-gold/80 to-transparent"
        />

        <div className="flex flex-col items-center gap-5 md:flex-row md:gap-8">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-lp-gold/40 bg-lp-gold/[0.08] text-lp-gold shadow-[0_0_30px_-12px_rgba(245,179,35,0.85)]">
            <Trophy className="size-8" strokeWidth={1.4} aria-hidden />
          </span>
          <div>
            <h3 className="text-balance text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Ready to take your gym to the next level?
            </h3>
            <p className="mt-2 text-sm text-lp-gold-highlight">
              Start your 14-day free trial today. No credit card required.
            </p>
          </div>
        </div>

        <a
          href="#pricing"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#FFD15C_0%,#F5B323_55%,#EFAE14_100%)] px-7 py-3 text-sm font-semibold text-[#171203] shadow-[0_12px_30px_-12px_rgba(245,179,35,0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_-10px_rgba(245,179,35,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-highlight"
        >
          Start Free Trial
          <ArrowRight className="size-4" aria-hidden />
        </a>
      </motion.div>
    </section>
  );
}
