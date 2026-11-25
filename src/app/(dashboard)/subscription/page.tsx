"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  Tag,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Zap,
  Gift,
  Check,
  X,
  RefreshCw,
  ArrowLeft,
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

type PaymentFlowStatus =
  | "idle"
  | "pending"
  | "success"
  | "failed"
  | "closed";

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SubscriptionPage() {
  const {
    subscription,
    remainingDays,
    totalDays,
    elapsedDays,
    isExpiringSoon,
    isExpired,
    refresh: refreshSub,
  } = useSubscription();

  const checkoutRef = useRef<HTMLDivElement>(null);
  const paymentStatusRef = useRef<HTMLDivElement>(null);

  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentStatus, setPaymentStatus] =
    useState<PaymentFlowStatus>("idle");
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

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
    }, 120);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setError(null);
    setAppliedCoupon(couponCode.trim().toUpperCase());
  };

  const handlePaymentStart = () => {
    setError(null);
    setPaymentStatus("pending");
    setPaymentMessage(
      "Razorpay checkout is open. Complete your payment to activate your subscription.",
    );
  };

  const handlePaymentDismiss = () => {
    setPaymentStatus((prev) => (prev === "success" ? "success" : "closed"));
    setPaymentMessage(
      "Checkout window was closed before completing verification. If you already paid, check payment status below.",
    );
    setTimeout(() => {
      paymentStatusRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
  };

  const handlePaymentSuccess = async () => {
    setPaymentStatus("success");
    setPaymentMessage(
      "Payment verified and subscription activated! Your updated plan dates are shown above.",
    );
    await refreshSub();
    setTimeout(() => {
      paymentStatusRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
  };

  const handlePaymentError = (err: Error) => {
    setPaymentStatus("failed");
    setPaymentMessage(
      err.message || "Payment could not be verified. Please try again.",
    );
    setTimeout(() => {
      paymentStatusRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
  };

  const handleCheckStatus = async () => {
    try {
      setCheckingStatus(true);
      await refreshSub();
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleReturnToCheckout = () => {
    setPaymentStatus("idle");
    setPaymentMessage(null);
    checkoutRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
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
        "Subscription will end on " + formatDate(res.currentPeriodEnd),
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

  // Status badge logic: Active / Expiring Soon / Expired
  const renderStatusBadge = () => {
    if (isExpired || subscription?.status === "EXPIRED" || subscription?.status === "NONE") {
      return (
        <Badge className="border border-rose-500/40 bg-rose-500/15 text-rose-400 font-semibold">
          Expired
        </Badge>
      );
    }
    if (isExpiringSoon) {
      return (
        <Badge className="border border-amber-400/50 bg-amber-500/15 text-amber-300 font-semibold">
          Expiring Soon
        </Badge>
      );
    }
    if (subscription?.status === "CANCELLED") {
      return (
        <Badge className="border border-zinc-700 bg-zinc-800 text-zinc-300 font-semibold">
          Cancelled (Active till expiry)
        </Badge>
      );
    }
    if (subscription?.status === "TRIALING") {
      return (
        <Badge className="border border-amber-500/40 bg-amber-500/15 text-amber-300 font-semibold">
          Active · Free Trial
        </Badge>
      );
    }
    return (
      <Badge className="border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 font-semibold">
        Active
      </Badge>
    );
  };

  const startDate = subscription?.startsAt ?? null;
  const expiryDate =
    subscription?.expiresAt ??
    subscription?.currentPeriodEnd ??
    subscription?.trialEndsAt ??
    null;

  const progressPercent =
    totalDays > 0
      ? Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)))
      : 0;

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* A. Page Header */}
        <header className="space-y-1.5">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Gym CRM Subscription
          </h1>
          <p className="text-sm sm:text-base text-zinc-400">
            Choose a plan to continue managing your gym.
          </p>
        </header>

        {cancelMessage && (
          <div className="rounded-[14px] border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            {cancelMessage}
          </div>
        )}

        {/* B. Current Subscription Status */}
        <section className="rounded-[14px] border border-zinc-800 bg-[#141418] p-6 sm:p-7 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Current Plan:
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {subscription?.planName ||
                    (subscription?.isTrial ? "Free Trial" : "No Active Plan")}
                </h2>
                {renderStatusBadge()}
              </div>
              <p className="text-xs sm:text-sm text-zinc-400">
                {isExpired
                  ? "Your subscription has expired. Select a plan below to restore full gym management access."
                  : isExpiringSoon
                    ? `Only ${remainingDays} ${remainingDays === 1 ? "day" : "days"} remaining. Renew early to extend from your current expiry date.`
                    : "Your DarkGold Gym CRM access is active and running smoothly."}
              </p>
            </div>

            {subscription?.status === "ACTIVE" &&
              !subscription.cancelAtPeriodEnd && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="text-xs text-rose-400 hover:text-rose-300 underline self-start sm:self-center"
                >
                  {cancelling ? "Processing..." : "Cancel at period end"}
                </button>
              )}
          </div>

          {/* 4-column Dates & Duration Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-zinc-800/80 bg-[#0E0E11] p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <Calendar className="h-3.5 w-3.5 text-amber-400" /> Purchased Date
              </div>
              <p className="mt-2 text-base sm:text-lg font-bold text-white">
                {formatDate(subscription?.lastPurchasedAt || startDate)}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-[#0E0E11] p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <Calendar className="h-3.5 w-3.5 text-amber-400" /> Expiry Date
              </div>
              <p className="mt-2 text-base sm:text-lg font-bold text-white">
                {formatDate(expiryDate)}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-[#0E0E11] p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <Clock className="h-3.5 w-3.5 text-amber-400" /> Total Duration
              </div>
              <p className="mt-2 text-base sm:text-lg font-bold text-white">
                {totalDays > 0 ? `${totalDays} Days` : "—"}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-[#0E0E11] p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <Zap className="h-3.5 w-3.5 text-amber-400" /> Remaining Days
              </div>
              <p
                className={`mt-2 text-base sm:text-lg font-extrabold ${
                  isExpired
                    ? "text-rose-400"
                    : isExpiringSoon
                      ? "text-amber-400"
                      : "text-emerald-400"
                }`}
              >
                {remainingDays > 0 ? `${remainingDays} Days` : "0 Days"}
              </p>
            </div>
          </div>

          {/* Subscription Progress Bar */}
          {totalDays > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                <span>
                  Days Elapsed:{" "}
                  <strong className="text-white">{elapsedDays}</strong> of{" "}
                  <strong className="text-white">{totalDays} days</strong>
                </span>
                <span>
                  <strong className="text-amber-400">{remainingDays}</strong>{" "}
                  days remaining ({progressPercent}% used)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isExpired
                      ? "bg-rose-500"
                      : isExpiringSoon
                        ? "bg-amber-400"
                        : "bg-gradient-to-r from-amber-500 to-yellow-400"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Expiry Warning (<= 7 days remaining) */}
          {(isExpiringSoon || isExpired) && (
            <div
              className={`flex items-start gap-3 rounded-xl border p-4 text-xs sm:text-sm ${
                isExpired
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-200"
              }`}
            >
              <AlertTriangle
                className={`h-4 w-4 shrink-0 mt-0.5 ${
                  isExpired ? "text-rose-400" : "text-amber-400"
                }`}
              />
              <div>
                <p className="font-semibold text-white">
                  {isExpired
                    ? "Subscription Expired"
                    : `Expiring Soon — ${remainingDays} ${remainingDays === 1 ? "day" : "days"} left`}
                </p>
                <p className="mt-0.5 text-zinc-300">
                  {isExpired
                    ? "Renew now to immediately reactivate your gym dashboard from today."
                    : "Renew before your expiry date to automatically extend your subscription without losing any remaining days."}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* C. Choose a Plan */}
        <section id="plans" className="space-y-6 scroll-mt-20">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Choose a plan
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Choose your next subscription period.
            </p>
          </div>

          {error && (
            <div className="rounded-[14px] border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-300">
              {error}
            </div>
          )}

          {plansLoading ? (
            <div className="rounded-[14px] border border-zinc-800 bg-[#141418] py-16 text-center text-sm text-zinc-400">
              Loading subscription plans...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
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

          {/* Checkout & Discount Summary Box when a plan is selected */}
          {selectedPlan && (
            <div
              ref={checkoutRef}
              className="rounded-[14px] border border-amber-500/40 bg-[#141418] p-6 sm:p-7 shadow-2xl shadow-amber-500/10 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    <Sparkles className="h-3 w-3 text-amber-400" /> Selected Plan
                  </span>
                  <h3 className="mt-2 text-2xl font-extrabold text-white">
                    {selectedPlan.name} Plan
                  </h3>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-3xl font-extrabold text-white">
                    ₹
                    {(
                      (quote?.pricing?.total ?? selectedPlan.pricePaise) / 100
                    ).toFixed(2)}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-400">
                    Total payable (incl. GST)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Discount Coupon Card */}
                <div className="rounded-xl border border-zinc-800 bg-[#0E0E11] p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-semibold text-zinc-200">
                        Have a Discount Code?
                      </span>
                    </div>
                    {appliedCoupon && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                        Coupon Active
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Enter coupon (e.g. LAUNCH10)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-[#141418] pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 uppercase tracking-wider focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="secondary"
                      className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-4 text-xs font-semibold text-white"
                    >
                      Apply
                    </Button>
                  </form>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        Coupon <strong>{appliedCoupon}</strong> applied!
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode("");
                        }}
                        className="flex items-center gap-0.5 text-zinc-300 hover:text-white underline"
                      >
                        <X className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-zinc-500">
                        Available offer:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCouponCode("LAUNCH10");
                          setAppliedCoupon("LAUNCH10");
                        }}
                        className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] text-amber-300 hover:bg-amber-500/20 transition-colors"
                      >
                        LAUNCH10 (10% OFF)
                      </button>
                    </div>
                  )}
                </div>

                {/* Price Breakdown & Razorpay Button */}
                <div className="rounded-xl border border-zinc-800 bg-[#0E0E11] p-4 sm:p-5 space-y-4">
                  {quote?.pricing ? (
                    <div className="space-y-2 text-xs sm:text-sm text-zinc-400">
                      <div className="flex justify-between">
                        <span>Base Plan Price</span>
                        <span className="text-zinc-200">
                          ₹{(quote.pricing.base / 100).toFixed(2)}
                        </span>
                      </div>
                      {quote.pricing.couponDiscount > 0 && (
                        <div className="flex justify-between font-medium text-emerald-400">
                          <span>Discount ({appliedCoupon})</span>
                          <span>
                            -₹{(quote.pricing.couponDiscount / 100).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>GST ({quote.pricing.gstPercent ?? 18}%)</span>
                        <span className="text-zinc-200">
                          ₹{(quote.pricing.gst / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-800 pt-2.5 text-base font-bold text-white">
                        <span>Total Amount</span>
                        <span className="text-lg text-amber-400">
                          ₹{(quote.pricing.total / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-xs text-zinc-400">
                      Calculating price breakdown...
                    </div>
                  )}

                  <CheckoutButton
                    plan={selectedPlan}
                    couponCode={appliedCoupon}
                    onStart={handlePaymentStart}
                    onDismiss={handlePaymentDismiss}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />

                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      Verified via Razorpay
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(null)}
                      className="text-zinc-400 hover:text-white underline"
                    >
                      Clear selection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* D. Payment Status Section (only visible when relevant to payment process) */}
        {paymentStatus !== "idle" && (
          <section
            ref={paymentStatusRef}
            className={`rounded-[14px] border p-6 shadow-xl ${
              paymentStatus === "success"
                ? "border-emerald-500/40 bg-emerald-950/20"
                : paymentStatus === "failed"
                  ? "border-rose-500/40 bg-rose-950/20"
                  : "border-amber-500/40 bg-amber-950/15"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                {paymentStatus === "success" && (
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400 mt-0.5" />
                )}
                {paymentStatus === "pending" && (
                  <Loader2 className="h-6 w-6 shrink-0 animate-spin text-amber-400 mt-0.5" />
                )}
                {paymentStatus === "failed" && (
                  <XCircle className="h-6 w-6 shrink-0 text-rose-400 mt-0.5" />
                )}
                {paymentStatus === "closed" && (
                  <AlertTriangle className="h-6 w-6 shrink-0 text-amber-400 mt-0.5" />
                )}

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {paymentStatus === "success" && "Payment Successful"}
                    {paymentStatus === "pending" && "Payment Pending"}
                    {paymentStatus === "failed" && "Payment Failed"}
                    {paymentStatus === "closed" && "Checkout Closed"}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-zinc-300">
                    {paymentMessage}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {(paymentStatus === "pending" ||
                  paymentStatus === "closed") && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCheckStatus}
                    disabled={checkingStatus}
                    className="rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold gap-1.5"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${checkingStatus ? "animate-spin" : ""}`}
                    />
                    Check payment status
                  </Button>
                )}

                {(paymentStatus === "failed" ||
                  paymentStatus === "closed") && (
                  <Button
                    type="button"
                    onClick={handleReturnToCheckout}
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold gap-1.5"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Return to checkout
                  </Button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Payment History Ledger */}
        <section className="space-y-4 pt-2">
          <div>
            <h3 className="text-lg font-bold text-white">
              Payment History &amp; Receipts
            </h3>
            <p className="text-xs text-zinc-400">
              Verified Razorpay transactions for your gym.
            </p>
          </div>
          <PaymentHistoryTable />
        </section>
      </div>
    </div>
  );
}
