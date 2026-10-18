import DarkGoldLogoHorizontal from "../../../public/logo_hr";
import { cn } from "@/lib/cn";

type BrandLogoProps = {
  className?: string;
  /** Hide the "Train Smarter. Manage Better." tagline (e.g. on tiny screens). */
  showTagline?: boolean;
};

/**
 * DarkGoldGym brand lockup (barbell emblem + wordmark), reusing the existing
 * horizontal logo asset. The dark parts follow `currentColor`; the wordmark
 * keeps its gold gradient.
 */
export function BrandLogo({ className, showTagline = true }: BrandLogoProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <DarkGoldLogoHorizontal
        className="h-12 w-auto text-auth-ink sm:h-14"
        aria-label="DarkGoldGym"
      />
      {showTagline && (
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-auth-muted">
          Train Smarter. Manage Better.
        </p>
      )}
    </div>
  );
}
