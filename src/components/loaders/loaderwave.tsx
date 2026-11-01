"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type LoaderSize = "sm" | "md" | "lg";
type LoaderTone = "gold" | "auth" | "current";

type LoaderProps = {
  className?: string;
  /** Bar height/width preset. Defaults to `md`. */
  size?: LoaderSize;
  /** `gold` for the app shell, `auth` for the login/onboarding screens. */
  tone?: LoaderTone;
  /** Optional caption rendered under the bars. */
  label?: string;
};

const SIZE_STYLES: Record<LoaderSize, { container: string; bar: string }> = {
  sm: { container: "h-6 gap-1", bar: "w-1.5" },
  md: { container: "h-10 gap-1.5", bar: "w-2.5" },
  lg: { container: "h-16 gap-2", bar: "w-4" },
};

const TONE_STYLES: Record<LoaderTone, string> = {
  gold: "bg-gold",
  auth: "bg-auth-gold",
  current: "bg-current",
};

const BAR_HEIGHTS = [34, 65, 100, 65, 34];

/**
 * Branded five-bar wave loader.
 *
 * Kept intentionally tiny: no images, no layout measurement, and a single
 * inline keyframe block. The bars use the same theme tokens as the rest of the
 * app, so the loader automatically follows light/dark mode.
 */
export function LoaderWave({
  className = "",
  size = "md",
  tone = "gold",
  label,
}: LoaderProps) {
  const sizing = SIZE_STYLES[size];
  const barColor = TONE_STYLES[tone];

  return (
    <div className={cn("inline-flex flex-col items-center gap-3", className)}>
      <div
        className={cn("flex items-end", sizing.container)}
        role="status"
        aria-live="polite"
        aria-label={label ?? "Loading"}
      >
        <style>{`
          @keyframes dgWaveBob {
            0%, 100% { transform: scaleY(0.35); }
            50% { transform: scaleY(1); }
          }
          @media (prefers-reduced-motion: reduce) {
            .dg-wave-bar {
              animation: none !important;
              transform: scaleY(0.7);
            }
          }
        `}</style>
        {BAR_HEIGHTS.map((height, index) => (
          <span
            key={index}
            className={cn("dg-wave-bar rounded-sm", sizing.bar, barColor)}
            style={{
              height: `${height}%`,
              transformOrigin: "bottom",
              animation: "dgWaveBob 1.1s ease-in-out infinite",
              animationDelay: `${index * 0.12}s`,
              willChange: "transform",
            }}
          />
        ))}
      </div>
      {label && (
        <span className="text-[13px] font-medium text-auth-muted">{label}</span>
      )}
    </div>
  );
}

export default LoaderWave;
