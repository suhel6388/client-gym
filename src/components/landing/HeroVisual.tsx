import Image from "next/image";
import { DashboardPreview } from "./DashboardPreview";

/**
 * Cinematic hero visual: a dumbbell-curl athlete emerges from the dark gym
 * lighting while the live CRM dashboard sits in front of the shot.
 *
 * Athlete photo: Tima Miroshnichenko / Pexels (free to use under the Pexels
 * license). It is intentionally decorative, so it is hidden from assistive
 * technology; the dashboard carries its own accessible summary.
 */
export function HeroVisual() {
  return (
    <div
      id="solutions"
      className="dg-hero-stage min-w-0 scroll-mt-28"
    >
      <span aria-hidden className="dg-hero-stage-glow" />
      <span aria-hidden className="dg-hero-stage-beam" />

      <div aria-hidden className="dg-hero-athlete">
        <Image
          src="/athlete-curl.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1280px) 46vw, (min-width: 768px) 92vw, 112vw"
          className="dg-hero-athlete-image"
        />
        <span className="dg-hero-athlete-light" />
        <span className="dg-hero-athlete-vest">DARKGOLD</span>
      </div>

      <div className="dg-hero-dashboard">
        <DashboardPreview />
      </div>
    </div>
  );
}
