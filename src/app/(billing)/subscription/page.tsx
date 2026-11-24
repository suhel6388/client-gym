"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CreditCard,
  Clock,
  Sparkles,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { cancelMySubscription } from "@/lib/api/billing";
import { PaymentHistoryTable } from "@/components/billing/PaymentHistoryTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function SubscriptionPage() {
  const { subscription, remainingDays, isExpiringSoon, refresh } =
    useSubscription();
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel? Your access will continue until the end of your billing cycle.")) {
      return;
    }
    try {
      setCancelling(true);
      const res = await cancelMySubscription();
      setCancelMessage("Subscription will end on " + new Date(res.currentPeriodEnd).toLocaleDateString());
      await refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Could not cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Active</Badge>;
      case "TRIALING":
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30">Free Trial</Badge>;
      case "CANCELLED":
        return <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700">Cancelled (Active till expiry)</Badge>;
      case "EXPIRED":
        return <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/30">Expired</Badge>;
      default:
        return <Badge tone="neutral">{status || "Unknown"}</Badge>;
    }
  };

  const expiryDate = subscription?.currentPeriodEnd || subscription?.trialEndsAt;
  const formattedExpiry = expiryDate
    ? new Date(expiryDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Subscription & Invoices
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your Gym CRM plan, track renewal dates, and view billing history.
          </p>
        </div>
        <div>
          <Link href="/upgrade">
            <Button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs sm:text-sm gap-1.5 shadow-md shadow-amber-500/10">
              <Sparkles className="h-4 w-4" /> Change / Upgrade Plan
            </Button>
          </Link>
        </div>
      </div>

      {cancelMessage && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-300">
          {cancelMessage}
        </div>
      )}

      {/* Subscription Status Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">
                {subscription?.planName || (subscription?.isTrial ? "Free Trial" : "Gym Plan")}
              </h2>
              {getStatusBadge(subscription?.status)}
            </div>
            <p className="text-xs text-zinc-400">
              {subscription?.isTrial
                ? "You are currently on a full-feature trial of DarkGold Gym CRM."
                : "Active SaaS platform subscription."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/upgrade">
              <Button variant="primary" className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm">
                Renew Plan
              </Button>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <Clock className="h-4 w-4 text-amber-400" /> Remaining Days
            </div>
            <p className="mt-2 text-2xl font-extrabold text-white">
              {remainingDays > 0 ? `${remainingDays} Days` : "Expired"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {isExpiringSoon ? "Action recommended" : "Full access granted"}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <Calendar className="h-4 w-4 text-emerald-400" /> Renews / Expires On
            </div>
            <p className="mt-2 text-lg font-bold text-zinc-200">{formattedExpiry}</p>
            <p className="mt-1 text-xs text-zinc-500">Auto-calculated server-side</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <CreditCard className="h-4 w-4 text-blue-400" /> Gateway Provider
            </div>
            <p className="mt-2 text-lg font-bold text-zinc-200">Razorpay Secure</p>
            <p className="mt-1 text-xs text-zinc-500">UPI, Cards, NetBanking</p>
          </div>
        </div>

        {subscription?.status === "ACTIVE" && !subscription.cancelAtPeriodEnd && (
          <div className="border-t border-zinc-800 pt-4 flex justify-between items-center text-xs text-zinc-500">
            <span>Need to stop recurring subscription?</span>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="text-rose-400 hover:text-rose-300 font-medium underline transition-colors"
            >
              {cancelling ? "Processing..." : "Cancel at period end"}
            </button>
          </div>
        )}
      </div>

      {/* Payment History Ledger */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white">Payment Ledger & Receipts</h3>
          <p className="text-xs text-zinc-400">
            Past payments recorded for your gym subscription.
          </p>
        </div>
        <PaymentHistoryTable />
      </div>
    </div>
  );
}
