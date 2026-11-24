import type { ReactNode } from "react";
import Link from "next/link";
import Script from "next/script";
import { ArrowLeft } from "lucide-react";
import DarkGoldLogoHorizontal from "../../../public/logo_hr";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { ToggleTheme } from "@/components/lightswind/toggle-theme";

export default function BillingLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" id="razorpay-checkout-sdk" />
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Minimal distraction-free header */}
        <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-36 sm:w-44">
                <DarkGoldLogoHorizontal />
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ToggleTheme />
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Gym
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {children}
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
          Secure 256-bit encrypted checkout powered by Razorpay. DarkGold Gym CRM SaaS.
        </footer>
      </div>
    </SessionProvider>
  );
}
