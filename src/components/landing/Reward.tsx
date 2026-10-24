"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Trophy, ArrowRight } from "lucide-react";

export default function GymReward() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="w-full bg-[#070707] px-6 pb-16 text-white sm:px-10">
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 rounded-xl border border-amber-400/60 bg-amber-400/[0.04] px-6 py-8 text-center shadow-[0_0_40px_-16px_rgba(251,191,36,0.45)] md:flex-row md:justify-between md:px-12 md:text-left"
      >
        <div className="flex flex-col items-center gap-5 md:flex-row md:gap-8">
          <Trophy className="h-14 w-14 shrink-0 text-amber-400" strokeWidth={1.25} />
          <div>
            <h3 className="text-2xl font-semibold sm:text-3xl">
              Ready to take your gym to the next level?
            </h3>
            <p className="mt-2 text-sm text-amber-400">
              Start your 14-day free trial today. No credit card required.
            </p>
          </div>
        </div>

        <a
          href="#pricing"
          className="flex shrink-0 items-center gap-2 rounded-md bg-gradient-to-b from-amber-300 to-amber-500 px-7 py-3 text-sm font-semibold text-black transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          Start Free Trial
          <ArrowRight className="h-4 w-4" />
        </a>
      </motion.div>
    </section>
  );
}