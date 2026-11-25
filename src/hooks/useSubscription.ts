"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchSubscriptionSummary, type SubscriptionSummary } from "@/lib/api/billing";
import { useSession } from "@/components/auth/SessionProvider";

export function useSubscription() {
  const { user, status: authStatus } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    // Super admins bypass gym subscription checks
    if (user?.role === "SUPER_ADMIN") {
      setSubscription({
        id: "super-admin",
        status: "ACTIVE",
        entitled: true,
        reason: "SUPER_ADMIN",
        remainingDays: 9999,
        isTrial: false,
      });
      setLoading(false);
      return;
    }

    if (!user?.gymId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const summary = await fetchSubscriptionSummary();
      setSubscription(summary);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load subscription status";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      loadSubscription();
    } else if (authStatus === "unauthenticated") {
      setSubscription(null);
      setLoading(false);
    }
  }, [authStatus, loadSubscription]);

  const remainingDays = subscription?.remainingDays ?? subscription?.daysLeft ?? 0;
  const totalDays = subscription?.totalDays ?? 0;
  const elapsedDays =
    subscription?.elapsedDays ??
    (totalDays > 0 ? Math.min(totalDays, Math.max(0, totalDays - remainingDays)) : 0);
  const isExpiringSoon =
    subscription?.isExpiringSoon ??
    (Boolean(subscription?.entitled) && remainingDays > 0 && remainingDays <= 7);
  const isExpired = subscription ? !subscription.entitled : false;

  return {
    subscription,
    loading,
    error,
    entitled: subscription?.entitled ?? true,
    isExpiringSoon,
    isExpired,
    remainingDays,
    totalDays,
    elapsedDays,
    refresh: loadSubscription,
  };
}
