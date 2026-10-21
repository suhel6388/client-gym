import { cn } from "@/lib/cn";
import { BrandLogo } from "./BrandLogo";

type AuthCardProps = {
  heading: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  /** Show the brand lockup at the top of the card (default true). */
  showLogo?: boolean;
};

/**
 * The premium auth card: #111111 surface, rounded-xl, restrained gold
 * hairline, DarkGoldGym logo, heading and subtitle.
 */
export function AuthCard({ heading, subtitle, children, className, showLogo = true }: AuthCardProps) {
  return (
    <div
      className={cn(
        "animate-auth-fade-up w-full max-w-106 rounded-xl border border-auth-line bg-auth-card shadow-auth-card",
        "before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:rounded-full before:bg-gradient-to-r before:from-transparent before:via-auth-gold/50 before:to-transparent",
        "relative",
        className,
      )}
    >
      <div className="px-6 py-7 sm:px-8 sm:py-8">
        {showLogo && (
          <div className="flex justify-center">
            <BrandLogo />
          </div>
        )}
        <div className={cn("text-center", showLogo && "mt-7")}>
          <h1 className="text-xl font-bold tracking-tight text-auth-ink sm:text-[22px]">{heading}</h1>
          {subtitle && <p className="mt-1.5 text-[13px] leading-relaxed text-auth-muted">{subtitle}</p>}
        </div>
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}
