"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

/* ---------- Content ---------- */
// TODO: these are sample reviews. Replace with real customer reviews.
type Review = { quote: string; name: string; gym: string };

const REVIEWS: Review[] = [
  {
    quote:
      "DarkGold Gym CRM has completely transformed the way we manage our gym. Collections increased and manual work decreased.",
    name: "Vikram Singh",
    gym: "FitZone Gym",
  },
  {
    quote:
      "The attendance and payment tracking features are amazing. Now I can focus more on my members and less on paperwork.",
    name: "Neha Kaur",
    gym: "Powerhouse Gym",
  },
  {
    quote:
      "Very easy to use and the support team is always there to help. Best investment for any gym owner!",
    name: "Arjun Mehta",
    gym: "Muscle Factory",
  },
  {
    quote:
      "Fee reminders go out automatically now, so I don't have to chase members every month.",
    name: "Rohit Verma",
    gym: "Iron Temple Fitness",
  },
  {
    quote:
      "My trainers assign workout and diet plans in minutes, and members love seeing them on their phones.",
    name: "Priya Sharma",
    gym: "FlexHub Studio",
  },
  {
    quote:
      "The reports show me exactly which plans sell best and when attendance drops. It helps me plan every month.",
    name: "Imran Khan",
    gym: "Beast Mode Gym",
  },
];

const AUTOPLAY_MS = 4000;
const N = REVIEWS.length;
// Clone the first 3 reviews at the end so the loop looks endless
const TRACK = [...REVIEWS, ...REVIEWS.slice(0, 3)];

/* ---------- Animation variants ---------- */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};
const reduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ---------- Component ---------- */
export default function GymReview() {
  const prefersReduced = useReducedMotion();
  const v = prefersReduced ? reduced : item;

  const [visible, setVisible] = useState(3); // cards per view
  const [index, setIndex] = useState(0);
  const [instant, setInstant] = useState(false); // skip animation for loop reset
  const [paused, setPaused] = useState(false);

  // Responsive cards-per-view
  useEffect(() => {
    const update = () =>
      setVisible(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const next = useCallback(() => setIndex((i) => (i >= N ? i : i + 1)), []);

  const prev = useCallback(() => {
    if (index === 0) {
      // jump to the cloned end, then slide back one
      setInstant(true);
      setIndex(N);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setInstant(false);
          setIndex(N - 1);
        })
      );
    } else {
      setIndex((i) => i - 1);
    }
  }, [index]);

  // Auto scroll
  useEffect(() => {
    if (paused || prefersReduced) return;
    const id = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, prefersReduced, next]);

  // After sliding onto the clones, silently reset to the real start
  const handleAnimationComplete = () => {
    if (index === N) {
      setInstant(true);
      setIndex(0);
      requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
    }
  };

  const activeDot = index % N;

  return (
    <section
      id="review"
      className="dg-lp-section relative isolate w-full overflow-hidden text-lp-ink"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lp-gold/[0.045] blur-[120px]"
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-lp-line/40" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-lp-line/30" />

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-[1300px] px-6 py-16 sm:px-10 lg:py-20"
      >
        <div className="text-center">
          <motion.p
            variants={v}
            className="text-xs font-semibold uppercase tracking-wider text-lp-gold"
          >
            Trusted by Gym Owners
          </motion.p>
          <motion.h2
            variants={v}
            className="mt-3 text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-4xl"
          >
            What our customers say
          </motion.h2>
        </div>

        <motion.div
          variants={v}
          className="mt-12 flex items-center gap-3 sm:gap-5"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <button
            type="button"
            onClick={prev}
            aria-label="Previous review"
            className="hidden size-10 shrink-0 items-center justify-center rounded-full border border-lp-line text-lp-ink transition-all duration-300 hover:border-lp-gold/70 hover:bg-lp-gold/[0.08] hover:text-lp-gold-highlight hover:shadow-[0_0_22px_-8px_rgba(245,179,35,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-highlight active:scale-95 sm:flex"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>

          {/* Viewport */}
          <div className="min-w-0 flex-1 overflow-hidden">
            <motion.div
              className="flex"
              animate={{ x: `-${(index * 100) / visible}%` }}
              transition={
                instant || prefersReduced
                  ? { duration: 0 }
                  : { duration: 0.7, ease: EASE }
              }
              onAnimationComplete={handleAnimationComplete}
            >
              {TRACK.map((r, i) => (
                <div
                  key={`${r.name}-${i}`}
                  className="shrink-0 px-2"
                  style={{ flexBasis: `${100 / visible}%` }}
                >
                  <article className="group h-full rounded-xl border border-lp-line bg-lp-card/70 p-5 backdrop-blur-sm transition-all duration-300 hover:border-lp-gold/35 hover:bg-lp-gold/[0.035] hover:shadow-[0_20px_44px_-30px_rgba(245,179,35,0.55)]">
                    <div className="flex gap-1" aria-label="5 out of 5 stars">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className="size-4 fill-lp-gold text-lp-gold"
                          aria-hidden
                        />
                      ))}
                    </div>

                    <p className="mt-4 min-h-[96px] text-sm leading-relaxed text-lp-ink/85">
                      &ldquo;{r.quote}&rdquo;
                    </p>

                    <div className="mt-5 flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full border border-lp-gold/45 bg-lp-gold/[0.08] text-sm font-semibold text-lp-gold transition-colors group-hover:border-lp-gold/70 group-hover:bg-lp-gold/[0.14]">
                        {initials(r.name)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-lp-ink">
                          {r.name}
                        </p>
                        <p className="text-xs text-lp-muted/80">{r.gym}</p>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </motion.div>
          </div>

          <button
            type="button"
            onClick={next}
            aria-label="Next review"
            className="hidden size-10 shrink-0 items-center justify-center rounded-full border border-lp-line text-lp-ink transition-all duration-300 hover:border-lp-gold/70 hover:bg-lp-gold/[0.08] hover:text-lp-gold-highlight hover:shadow-[0_0_22px_-8px_rgba(245,179,35,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-gold-highlight active:scale-95 sm:flex"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </motion.div>

        {/* Dots */}
        <motion.div variants={v} className="mt-6 flex justify-center gap-2">
          {REVIEWS.map((r, i) => (
            <button
              key={r.name}
              type="button"
              aria-label={`Go to review ${i + 1}`}
              aria-current={i === activeDot ? "true" : undefined}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeDot
                  ? "w-6 bg-lp-gold shadow-[0_0_10px_rgba(245,179,35,0.75)]"
                  : "w-1.5 bg-lp-muted/40 hover:bg-lp-gold/50"
              }`}
            />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
