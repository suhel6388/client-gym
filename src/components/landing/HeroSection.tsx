import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { DashboardPreview } from "./DashboardPreview";
import { HeroVisual } from "./HeroVisual";
import {
  HeroColumn,
  HeroItem,
  HeroList,
  HeroListItem,
  HeroReveal,
  HeroVisualReveal,
} from "./HeroMotion";
import { ScheduleCallLauncher } from "./ScheduleCallDialog";
import { FEATURE_HIGHLIGHTS, HERO_COPY, TRUST_INDICATORS } from "./content";

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative isolate flex flex-col overflow-hidden 
      // bg-lp-canvas 
      xl:min-h-[calc(100svh-84px)] xl:justify-center"
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

      <HeroReveal className="relative z-10 mx-auto grid w-full max-w-[1440px] gap-12 px-5 pb-16 pt-12 sm:gap-14 sm:px-8 sm:pb-20 sm:pt-14 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-center md:gap-6 md:px-6 md:pb-10 md:pt-12 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:gap-10 lg:px-10 lg:pb-12 lg:pt-16 xl:gap-10 xl:px-12 xl:pb-14 xl:pt-12">
        {/* Marketing copy */}
        <HeroColumn className="min-w-0">
          <HeroItem className="inline-flex items-center gap-2 rounded-full border border-lp-gold/25 bg-lp-gold/[0.055] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-lp-gold-highlight shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] md:gap-1.5 md:px-3 md:py-1 md:text-[9.5px] md:tracking-[0.16em] min-[851px]:text-[10px] lg:px-3.5 lg:text-[10px] lg:tracking-[0.18em]">
            <span aria-hidden className="relative flex size-1.5">
              <span className="absolute inset-0 rounded-full bg-lp-gold shadow-[0_0_10px_rgba(245,179,35,0.9)]" />
            </span>
            {HERO_COPY.badge}
          </HeroItem>

          <HeroItem className="mt-6 md:mt-5 lg:mt-6">
            <h1 className="max-w-[670px] text-balance text-[clamp(2.5rem,6vw,3rem)] font-bold leading-[1.02] tracking-[-0.05em] text-lp-ink md:text-[2.4rem] md:leading-[1.05] md:tracking-[-0.04em] min-[851px]:text-[2.7rem] lg:text-[3rem] lg:leading-[1.02] lg:tracking-[-0.045em] xl:text-[3.25rem] xl:tracking-[-0.05em] min-[1440px]:text-[3.55rem]">
              {HERO_COPY.headline.lead}
              <br />
              <span className="dg-gold-text">{HERO_COPY.headline.continuation}</span>
              {HERO_COPY.headline.brand}
            </h1>
          </HeroItem>

          <HeroItem className="mt-5 md:mt-4 lg:mt-5">
            <p className="max-w-[570px] text-[14.5px] leading-7 text-lp-muted sm:text-[15.5px] md:max-w-none md:text-[14px] md:leading-[1.65] min-[851px]:text-[15px] min-[851px]:leading-7 lg:text-[15.5px]">
              {HERO_COPY.description}
            </p>
          </HeroItem>

          <HeroItem className="mt-8 md:hidden lg:block">
            <h2 className="sr-only">Core gym management features</h2>
            <HeroList className="flex max-w-[760px] flex-wrap items-start gap-x-7 gap-y-5 lg:gap-x-5 xl:gap-x-7 min-[1440px]:flex-nowrap min-[1440px]:gap-x-8">
              {FEATURE_HIGHLIGHTS.map((feature) => {
                const Icon = feature.icon;
                return (
                  <HeroListItem
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
                  </HeroListItem>
                );
              })}
            </HeroList>
          </HeroItem>

          <HeroItem className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-center md:mt-7 lg:mt-9">
            <Link
              href={HERO_COPY.primaryCta.href}
              className="group inline-flex h-[52px] items-center justify-center gap-6 rounded-xl bg-[linear-gradient(135deg,#FFD15C_0%,#F5B323_52%,#E7A310_100%)] px-6 text-[13.5px] font-bold text-[#171203] shadow-[0_14px_36px_-14px_rgba(245,179,35,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-12px_rgba(245,179,35,0.9)] focus-visible:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-gold-highlight sm:w-auto md:gap-4 md:px-5 min-[851px]:gap-6 min-[851px]:px-6 lg:h-[52px] lg:px-6"
            >
              {HERO_COPY.primaryCta.label}
              <ArrowRight
                aria-hidden
                className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
                strokeWidth={2.2}
              />
            </Link>

            <ScheduleCallLauncher label={HERO_COPY.secondaryCta.label} />
          </HeroItem>

          <HeroList className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5 pt-5 md:mt-7 md:gap-x-4 min-[851px]:gap-x-5 lg:mt-8 lg:gap-x-6">
            {TRUST_INDICATORS.map((indicator) => {
              const Icon = indicator.icon;
              return (
                <HeroListItem
                  key={indicator.label}
                  className="flex items-center gap-2 text-[11.5px] font-medium text-lp-ink/80"
                >
                  <Icon
                    className="size-4 shrink-0 text-lp-gold"
                    strokeWidth={1.7}
                    aria-hidden
                  />
                  {indicator.label}
                </HeroListItem>
              );
            })}
          </HeroList>
        </HeroColumn>

        {/* Product preview with athlete backdrop */}
        <HeroVisualReveal className="min-w-0">
          <HeroVisual />
        </HeroVisualReveal>
      </HeroReveal>

      {/* Dashboard preview spanning both hero columns until the full desktop
          composition brings its own floating dashboard back at 1280px. */}
      <div className="relative z-10 mx-auto hidden w-full max-w-[1440px] px-5 pb-12 sm:px-8 md:block md:px-6 lg:px-10 lg:pb-14 xl:hidden">
        <DashboardPreview />
      </div>
    </section>
  );
}
