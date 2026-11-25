"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ArrowRight, X } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export function SubscriptionBanner() {
  const { isExpiringSoon, isExpired, remainingDays, subscription } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (!isExpiringSoon && !isExpired) return null;

  if (isExpired) {
    return (
      <div className="relative flex items-center justify-between gap-3 border-b border-rose-500/30 bg-rose-950/40 px-4 py-2.5 text-rose-200">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>
            Your gym subscription has expired. Management features are restricted until renewed.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/subscription#plans"
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 transition-colors"
          >
            Renew Now <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-950/40 px-4 py-2 text-amber-200">
      <div className="flex items-center gap-2.5 text-xs sm:text-sm">
        <Clock className="h-4 w-4 shrink-0 text-amber-400" />
        <span>
          {subscription?.isTrial ? "Trial ending soon:" : "Subscription ending soon:"}{" "}
          <strong className="font-semibold text-white">
            {remainingDays === 1 ? "1 day left" : `${remainingDays} days remaining`}
          </strong>
          . Renew today to keep your attendance, analytics, and CRM uninterrupted.
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <Link
          href="/subscription#plans"
          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          Renew / Upgrade <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 text-amber-400 hover:text-white transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

