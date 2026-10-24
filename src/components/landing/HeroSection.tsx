import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { HeroVisual } from "./HeroVisual";
import { FEATURE_HIGHLIGHTS, HERO_COPY, TRUST_INDICATORS } from "./content";

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative isolate flex flex-col overflow-hidden bg-lp-canvas xl:min-h-[calc(100svh-84px)] xl:justify-center"
    >
      {/* Atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="dg-hero-surface absolute inset-0" />
        <div className="dg-hero-grid absolute inset-0" />
        <div className="absolute -left-44 top-24 size-[440px] rounded-full bg-lp-gold/[0.045] blur-[120px]" />
        <div className="absolute -right-40 top-0 h-[660px] w-[660px] rounded-full bg-lp-gold/[0.07] blur-[140px]" />
        <div className="absolute bottom-[-260px] left-1/2 size-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,179,35,0.07),transparent_65%)] blur-[80px]" />
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lp-gold/20 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1440px] gap-14 px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-14 lg:px-10 lg:pb-[5.5rem] lg:pt-16 xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] xl:items-center xl:gap-10 xl:px-12 xl:pb-14 xl:pt-12">
        {/* Marketing copy */}
        <div
          id="about"
          className="min-w-0 scroll-mt-28 lg:mx-auto lg:max-w-[760px] xl:mx-0 xl:max-w-none"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-lp-gold/25 bg-lp-gold/[0.055] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-lp-gold-highlight shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
            <span aria-hidden className="relative flex size-1.5">
              <span className="absolute inset-0 rounded-full bg-lp-gold shadow-[0_0_10px_rgba(245,179,35,0.9)]" />
            </span>
            {HERO_COPY.badge}
          </div>

          <h1 className="mt-6 max-w-[670px] text-balance text-[clamp(2.5rem,4.2vw,3.55rem)] font-bold leading-[1.02] tracking-[-0.05em] text-lp-ink xl:text-[3.25rem] min-[1440px]:text-[3.55rem]">
            {HERO_COPY.headline.lead}
            <br />
            {HERO_COPY.headline.continuation}
            <span className="dg-gold-text">{HERO_COPY.headline.brand}</span>
          </h1>

          <p className="mt-5 max-w-[570px] text-[14.5px] leading-7 text-lp-muted sm:text-[15.5px]">
            {HERO_COPY.description}
          </p>

          <div id="features" className="mt-8 scroll-mt-28">
            <h2 className="sr-only">Core gym management features</h2>
            <ul className="flex max-w-[760px] flex-wrap items-start gap-x-7 gap-y-5 min-[1440px]:flex-nowrap min-[1440px]:gap-x-8">
              {FEATURE_HIGHLIGHTS.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li
                    key={feature.id}
                    id={feature.id}
                    className="flex w-[84px] scroll-mt-28 flex-col items-center gap-2 text-center"
                  >
                    <Icon
                      className="size-8 shrink-0 text-lp-gold"
                      strokeWidth={1.4}
                      aria-hidden
                    />
                    <span className="text-[11.5px] font-medium leading-4 text-lp-ink/85">
                      {feature.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={HERO_COPY.primaryCta.href}
              className="group inline-flex h-[52px] items-center justify-center gap-6 rounded-xl bg-[linear-gradient(135deg,#FFD15C_0%,#F5B323_52%,#E7A310_100%)] px-6 text-[13.5px] font-bold text-[#171203] shadow-[0_14px_36px_-14px_rgba(245,179,35,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-12px_rgba(245,179,35,0.9)] focus-visible:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-gold-highlight sm:w-auto"
            >
              {HERO_COPY.primaryCta.label}
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                strokeWidth={2.2}
              />
            </Link>

            <Link
              href={HERO_COPY.secondaryCta.href}
              className="group inline-flex h-[52px] items-center justify-center gap-6 rounded-xl border border-lp-gold/35 bg-black/10 px-6 text-[13.5px] font-semibold text-lp-ink transition-all duration-300 hover:border-lp-gold/65 hover:bg-lp-gold/[0.065] hover:text-lp-gold-highlight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-gold-highlight sm:w-auto"
            >
              {HERO_COPY.secondaryCta.label}
              <CalendarDays
                aria-hidden
                className="size-4 text-lp-gold transition-transform duration-300 group-hover:scale-105"
                strokeWidth={1.9}
              />
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5 pt-5">
            {TRUST_INDICATORS.map((indicator) => {
              const Icon = indicator.icon;
              return (
                <li
                  key={indicator.label}
                  className="flex items-center gap-2 text-[11.5px] font-medium text-lp-ink/80"
                >
                  <Icon
                    className="size-4 shrink-0 text-lp-gold"
                    strokeWidth={1.7}
                    aria-hidden
                  />
                  {indicator.label}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Product preview with athlete backdrop */}
        <HeroVisual />
      </div>
    </section>
  );
}
