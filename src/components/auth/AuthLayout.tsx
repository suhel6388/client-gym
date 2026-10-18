import { ShieldCheck } from "lucide-react";

/**
 * Full-viewport dark-and-gold backdrop for the auth screens: near-black
 * (#080808) with a subtle abstract texture, the card centred, and a small
 * trust footer. Fully responsive — the card simply centres on any width.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-backdrop relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <main className="relative z-10 flex w-full flex-col items-center">{children}</main>

      <footer className="relative z-10 mt-8 flex items-center gap-1.5 text-[11px] text-auth-faint">
        <ShieldCheck className="size-3.5 text-auth-gold/70" strokeWidth={2} aria-hidden />
        <span>Secure sign-in · Your gym data is encrypted in transit</span>
      </footer>
    </div>
  );
}
