import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { ToggleTheme } from "@/components/lightswind/toggle-theme";

/**
 * Full-viewport theme-aware backdrop for the auth screens: light cream in light
 * mode, near-black (#080808) with gold accents in dark mode, a subtle abstract
 * texture, the card centred, and a small trust footer. Fully responsive — the
 * card simply centres on any width.
 *
 * The "Back to Home" link is rendered once here so every auth screen (login,
 * signup, forgot/reset password, verification) can return to the landing page.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-backdrop relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="group absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-lg border border-auth-line bg-auth-card/70 px-3 py-2 text-xs font-medium text-auth-muted backdrop-blur transition-colors hover:border-auth-gold/40 hover:text-auth-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auth-gold/40 sm:left-6 sm:top-6 sm:text-[13px]"
      >
        <ArrowLeft
          className="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
          strokeWidth={2}
          aria-hidden
        />
        Back to Home
      </Link>

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ToggleTheme
          animationType="swipe-down"
          className="border border-auth-line bg-auth-card/80 text-auth-muted backdrop-blur hover:border-auth-gold/40 hover:bg-auth-card hover:text-auth-gold"
        />
      </div>

      <main className="relative z-10 flex w-full flex-col items-center">{children}</main>

      <footer className="relative z-10 mt-8 flex items-center gap-1.5 text-[11px] text-auth-faint">
        <ShieldCheck className="size-3.5 text-auth-gold/70" strokeWidth={2} aria-hidden />
        <span>Secure sign-in · Your gym data is encrypted in transit</span>
      </footer>
    </div>
  );
}
