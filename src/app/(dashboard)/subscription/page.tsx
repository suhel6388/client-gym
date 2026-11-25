"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CreditCard,
  Clock,
  Sparkles,
  ShieldCheck,
  Tag,
  CheckCircle2,
  ArrowRight,
  Zap,
  Gift,
  Check,
  X,
  ArrowDown,
} from "lucide-react";
import {
  fetchBillingPlans,
  fetchPlanQuote,
  cancelMySubscription,
  type BillingPlan,
  type PricingQuote,
} from "@/lib/api/billing";
import { useSubscription } from "@/hooks/useSubscription";
import { PlanCard } from "@/components/billing/PlanCard";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { PaymentHistoryTable } from "@/components/billing/PaymentHistoryTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function SubscriptionPage() {
  const router = useRouter();
  const { subscription, remainingDays, isExpiringSoon, refresh: refreshSub } =
    useSubscription();

  const plansRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<HTMLDivElement>(null);

  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setPlansLoading(true);
        const data = await fetchBillingPlans();
        if (active) {
          const list = Array.isArray(data) ? data : [];
          const sorted = [...list].sort(
            (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
          );
          setPlans(sorted);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load plans");
        }
      } finally {
        if (active) setPlansLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedPlan) return;

    let active = true;
    async function updateQuote() {
      try {
        const q = await fetchPlanQuote(selectedPlan!.id, appliedCoupon);
        if (active) setQuote(q);
      } catch {
        if (appliedCoupon && active) {
          setAppliedCoupon(null);
          setError("Coupon code is invalid or expired.");
        }
      }
    }
    updateQuote();
    return () => {
      active = false;
    };
  }, [selectedPlan, appliedCoupon]);

  const handleSelectPlan = (plan: BillingPlan) => {
    setSelectedPlan(plan);
    setError(null);
    setTimeout(() => {
      checkoutRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 150);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setError(null);
    setAppliedCoupon(couponCode.trim().toUpperCase());
  };

  const handlePaymentSuccess = async () => {
    setSuccess(true);
    await refreshSub();
    setTimeout(() => {
      setSuccess(false);
      setSelectedPlan(null);
      setAppliedCoupon(null);
      setCouponCode("");
      router.push("/dashboard");
    }, 2000);
  };

  const handleCancel = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel? Your access will continue until the end of your billing cycle.",
      )
    ) {
      return;
    }
    try {
      setCancelling(true);
      const res = await cancelMySubscription();
      setCancelMessage(
        "Subscription will end on " +
          new Date(res.currentPeriodEnd).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
      );
      await refreshSub();
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : "Could not cancel subscription",
      );
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            Active
          </Badge>
        );
      case "TRIALING":
        return (
          <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30">
            Free Trial
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-card-hover text-subtle border border-line">
            Cancelled (Active till expiry)
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge className="bg-rose-500/15 text-rose-500 border border-rose-500/30">
            Expired
          </Badge>
        );
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

  if (success) {
    return (
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md rounded-2xl border border-emerald-500/30 bg-card p-8 text-center shadow-card">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500 mb-4 animate-bounce" />
          <h2 className="text-2xl font-extrabold text-ink">
            Payment Successful!
          </h2>
          <p className="mt-2 text-sm text-subtle">
            Your DarkGold Gym CRM subscription is now active. Redirecting you to
            your dashboard...
          </p>
          <div className="mt-6">
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
            >
              Go to Dashboard <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Subscription &amp; Billing
          </h1>
          <p className="mt-1 text-sm text-subtle">
            View your current plan, upgrade or renew in 2 simple steps, and
            check past invoices.
          </p>
        </div>
        <Button
          type="button"
          onClick={() =>
            plansRef.current?.scrollIntoView({ behavior: "smooth" })
          }
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs sm:text-sm gap-1.5 shadow-md shadow-amber-500/15 self-start sm:self-auto"
        >
          <Sparkles className="h-4 w-4" />
          {subscription?.entitled ? "Change / Upgrade Plan" : "Renew Now"}
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      {cancelMessage && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-300">
          {cancelMessage}
        </div>
      )}

      {/* 1. Current Subscription Overview */}
      <section className="rounded-2xl border border-line bg-card p-5 sm:p-6 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-faint">
              Current Plan
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-ink">
                {subscription?.planName ||
                  (subscription?.isTrial ? "Free Trial" : "Gym Plan")}
              </h2>
              {getStatusBadge(subscription?.status)}
            </div>
            <p className="text-xs text-subtle">
              {subscription?.isTrial
                ? "You are currently on a full-feature free trial of DarkGold Gym CRM."
                : subscription?.entitled
                  ? "All gym management features are unlocked and active."
                  : "Your plan has expired. Select a plan below to restore full access."}
            </p>
          </div>
        </div>

        {/* 3 Clear Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-line bg-canvas/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-faint uppercase tracking-wider">
              <Clock className="h-4 w-4 text-amber-500" /> Time Remaining
            </div>
            <p className="mt-2 text-2xl font-extrabold text-ink">
              {remainingDays > 0 ? `${remainingDays} Days` : "Expired"}
            </p>
            <p className="mt-1 text-xs text-subtle">
              {isExpiringSoon
                ? "Renew soon to avoid interruption"
                : remainingDays > 0
                  ? "Full access active"
                  : "Select a plan below to activate"}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-canvas/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-faint uppercase tracking-wider">
              <Calendar className="h-4 w-4 text-emerald-500" /> Valid Until
            </div>
            <p className="mt-2 text-lg font-bold text-ink">{formattedExpiry}</p>
            <p className="mt-1 text-xs text-subtle">
              {subscription?.cancelAtPeriodEnd
                ? "Ends on this date"
                : "Current billing period end"}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-canvas/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-faint uppercase tracking-wider">
              <CreditCard className="h-4 w-4 text-amber-500" /> Payment Gateway
            </div>
            <p className="mt-2 text-lg font-bold text-ink">Razorpay Secure</p>
            <p className="mt-1 text-xs text-subtle">
              UPI, Cards, NetBanking &amp; Wallets
            </p>
          </div>
        </div>

        {subscription?.status === "ACTIVE" && !subscription.cancelAtPeriodEnd && (
          <div className="border-t border-line pt-4 flex flex-wrap justify-between items-center gap-2 text-xs text-faint">
            <span>Need to stop auto-renewal at the end of this cycle?</span>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="text-rose-500 hover:text-rose-400 font-medium underline transition-colors"
            >
              {cancelling ? "Processing..." : "Cancel at period end"}
            </button>
          </div>
        )}
      </section>

      {/* 2. Choose / Upgrade Plan (Shifted from /upgrade) */}
      <section ref={plansRef} id="plans" className="space-y-6 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-300 mb-2">
              <Sparkles className="h-3 w-3 text-amber-500" /> Step 1 of 2 ·
              Choose Your Plan
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-ink">
              Upgrade or Renew Your Plan
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-subtle">
              Click <strong>Select Plan</strong> on any tier below to apply a
              discount coupon and complete payment via Razorpay.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-500 dark:text-rose-300">
            {error}
          </div>
        )}

        {plansLoading ? (
          <div className="rounded-2xl border border-line bg-card py-16 text-center text-subtle text-sm">
            Loading available subscription plans...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((p) => {
              const isCurrent =
                subscription?.planName === p.name && subscription?.entitled;
              const isSelected = selectedPlan?.id === p.id;
              return (
                <PlanCard
                  key={p.id}
                  plan={p}
                  isCurrent={isCurrent}
                  isSelected={isSelected}
                  onSelect={handleSelectPlan}
                />
              );
            })}
          </div>
        )}

        {/* Step 2 Prompt or Checkout Box */}
        {!selectedPlan && !plansLoading && (
          <div className="rounded-2xl border border-dashed border-line-strong bg-card/50 p-6 text-center">
            <p className="text-sm font-semibold text-ink">
              Step 2: Select a plan above to see your price breakdown &amp;
              Razorpay checkout
            </p>
            <p className="text-xs text-subtle mt-1">
              You can apply discount coupons (like{" "}
              <span className="font-mono text-amber-500 font-semibold">
                LAUNCH10
              </span>
              ) before paying.
            </p>
          </div>
        )}

        {selectedPlan && (
          <div
            ref={checkoutRef}
            className="rounded-2xl border border-amber-500/40 bg-card p-6 sm:p-8 shadow-xl shadow-amber-500/5 space-y-6"
          >
            {/* Checkout Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25">
                    <Zap className="h-3 w-3" /> Step 2 of 2 · Ready to Pay
                  </span>
                  <span className="text-xs text-subtle">
                    {selectedPlan.durationMonths === 1
                      ? "1-month billing"
                      : `${selectedPlan.durationMonths}-month billing`}
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-ink mt-2">
                  {selectedPlan.name} Plan
                </h3>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-3xl font-extrabold text-ink">
                  ₹
                  {(
                    (quote?.pricing?.total ?? selectedPlan.pricePaise) / 100
                  ).toFixed(2)}
                </span>
                <span className="text-xs text-subtle block mt-0.5">
                  Total payable (incl. 18% GST)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left: Discount Coupon Card */}
              <div className="rounded-xl border border-line bg-canvas/60 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-semibold text-ink">
                      Have a Discount Code?
                    </span>
                  </div>
                  {appliedCoupon && (
                    <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                      Coupon Active
                    </span>
                  )}
                </div>

                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-faint" />
                    <input
                      type="text"
                      placeholder="Enter code (e.g. LAUNCH10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full rounded-xl bg-card border border-line pl-9 pr-3 py-2 text-xs sm:text-sm text-ink placeholder-faint focus:outline-none focus:border-amber-500 uppercase tracking-wider"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="secondary"
                    className="px-4 text-xs font-semibold rounded-xl"
                  >
                    Apply
                  </Button>
                </form>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-emerald-600 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Coupon <strong>{appliedCoupon}</strong> applied!
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode("");
                      }}
                      className="text-subtle hover:text-ink flex items-center gap-0.5 underline ml-2"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-faint">
                      Available offer:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCouponCode("LAUNCH10");
                        setAppliedCoupon("LAUNCH10");
                      }}
                      className="text-[11px] font-mono px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
                    >
                      LAUNCH10 (10% OFF)
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Price Breakdown & Razorpay Button */}
              <div className="rounded-xl border border-line bg-canvas/60 p-4 sm:p-5 space-y-4">
                {quote?.pricing ? (
                  <div className="space-y-2 text-xs sm:text-sm text-subtle">
                    <div className="flex justify-between">
                      <span>Base Plan Price</span>
                      <span className="text-ink font-medium">
                        ₹{(quote.pricing.base / 100).toFixed(2)}
                      </span>
                    </div>
                    {quote.pricing.couponDiscount > 0 && (
                      <div className="flex justify-between text-emerald-500 font-medium">
                        <span>Discount ({appliedCoupon})</span>
                        <span>
                          -₹{(quote.pricing.couponDiscount / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>GST (18%)</span>
                      <span className="text-ink font-medium">
                        ₹{(quote.pricing.gst / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-line pt-2.5 text-base font-bold text-ink">
                      <span>Total Amount</span>
                      <span className="text-amber-500 text-lg">
                        ₹{(quote.pricing.total / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-subtle py-2">
                    Calculating exact price breakdown...
                  </div>
                )}

                <CheckoutButton
                  plan={selectedPlan}
                  couponCode={appliedCoupon}
                  onSuccess={handlePaymentSuccess}
                  onError={(err) => setError(err.message)}
                />

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-faint pt-1">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Instant activation via Razorpay
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(null)}
                    className="text-subtle hover:text-ink underline"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. Payment History Ledger */}
      <section className="space-y-4 pt-2">
        <div>
          <h3 className="text-lg font-bold text-ink">
            Payment History &amp; Receipts
          </h3>
          <p className="text-xs text-subtle">
            Past subscription transactions recorded for your gym.
          </p>
        </div>
        <PaymentHistoryTable />
      </section>
    </div>
  );
}

