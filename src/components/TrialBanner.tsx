"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Sparkles } from "lucide-react";
import { fetchSubscription, type SubscriptionStatus } from "@/lib/auth-api";
import { cn } from "@/lib/cn";

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/**
 * SaaS entitlement strip for the dashboard. All dates and day counts come
 * from the backend (`GET /api/v1/subscription/me`) — nothing is hardcoded or
 * computed from local state.
 */
export function TrialBanner({ className }: { className?: string }) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    let active = true;
    fetchSubscription()
      .then((data) => {
        if (active) setStatus(data);
      })
      .catch(() => {
        // Entitlement display is non-critical; the backend still enforces it.
      });
    return () => {
      active = false;
    };
  }, []);

  if (!status) return null;

  const { subscription, entitled, remainingDays } = status;
  const isTrial = subscription?.status === "TRIALING";

  let icon = Sparkles;
  let tone = "border-auth-gold/30 bg-auth-gold/[0.06]";
  let title = "Free trial";
  let detail = "";

  if (isTrial) {
    title = entitled ? "Free trial" : "Trial ended";
    detail = entitled
      ? `${remainingDays} day${remainingDays === 1 ? "" : "s"} left`
      : "Upgrade to keep managing your gym.";
  } else if (subscription?.status === "ACTIVE") {
    icon = CalendarClock;
    tone = "border-success/25 bg-success/[0.05]";
    title = subscription.planNameSnapshot || "Subscription active";
    const ends = formatDate(subscription.currentPeriodEnd);
    detail = ends ? `Renews ${ends}` : "";
  } else if (subscription?.status === "CANCELLED") {
    icon = CalendarClock;
    tone = "border-warning/25 bg-warning/[0.05]";
    title = "Cancelled";
    const ends = formatDate(subscription.currentPeriodEnd);
    detail = ends ? `Access ends ${ends}` : "";
  } else {
    icon = CalendarClock;
    tone = "border-line-strong bg-card";
    title = "No active subscription";
    detail = "Contact support to restore access.";
  }

  const Icon = icon;
  const progress =
    isTrial && entitled && subscription?.trialStartsAt && subscription?.trialEndsAt
      ? (() => {
          const start = new Date(subscription.trialStartsAt).getTime();
          const end = new Date(subscription.trialEndsAt).getTime();
          const now = Date.now();
          if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
          return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
        })()
      : null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border px-4 py-2.5",
        tone,
        className,
      )}
      role="status"
    >
      <Icon className="size-4 shrink-0 text-auth-gold" strokeWidth={2} aria-hidden />
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      {detail && <p className="text-xs text-subtle">{detail}</p>}
      {progress !== null && (
        <div className="ml-auto h-1.5 w-28 overflow-hidden rounded-full bg-line" aria-hidden>
          <div
            className="h-full rounded-full bg-auth-gold transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
