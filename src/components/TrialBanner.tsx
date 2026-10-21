"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Sparkles } from "lucide-react";
import { fetchSubscription, type SubscriptionStatus } from "@/lib/api";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/**
 * The banner remounts whenever the dashboard is revisited, so a module-level
 * guard keeps entitlement prompts to one per app session rather than showing
 * them again after the user has dismissed them.
 */
const shownEntitlementNotices = new Set<string>();

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
        if (!active) return;
        setStatus(data);

        // One entitlement notice per session. The banner keeps the status
        // visible afterwards, so this is only a one-time prompt.
        const subscription = data.subscription;
        if (subscription?.status !== "TRIALING") return;

        if (!data.entitled) {
          if (!shownEntitlementNotices.has("trial-ended")) {
            shownEntitlementNotices.add("trial-ended");
            toast.subscription(
              "Your free trial has ended",
              "Upgrade to keep managing your gym. Your data stays safe.",
              { dedupeKey: "trial-ended", persistent: true },
            );
          }
          return;
        }

        if (data.remainingDays <= 3 && !shownEntitlementNotices.has("trial-ending-soon")) {
          shownEntitlementNotices.add("trial-ending-soon");
          const when =
            data.remainingDays <= 0
              ? "today"
              : `in ${data.remainingDays} day${data.remainingDays === 1 ? "" : "s"}`;
          toast.subscription(
            "Trial ending soon",
            `Your free trial ends ${when}. Upgrade to keep uninterrupted access.`,
            { dedupeKey: "trial-ending-soon", duration: 8000 },
          );
        }
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
