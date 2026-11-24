"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Tag,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Zap,
  Gift,
  Check,
  X,
} from "lucide-react";
import {
  fetchBillingPlans,
  fetchPlanQuote,
  type BillingPlan,
  type PricingQuote,
} from "@/lib/api/billing";
import { PlanCard } from "@/components/billing/PlanCard";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/Button";

export default function UpgradePage() {
  const router = useRouter();
  const { subscription, refresh: refreshSub } = useSubscription();
  const checkoutRef = useRef<HTMLDivElement>(null);

  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setPlansLoading(true);
        const data = await fetchBillingPlans();
        if (active) {
          // Sort plans by displayOrder or price
          const sorted = [...data].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
          setPlans(sorted);
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load plans");
      } finally {
        if (active) setPlansLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  // Update quote when selected plan or applied coupon changes
  useEffect(() => {
    if (!selectedPlan) return;

    let active = true;
    async function updateQuote() {
      try {
        const q = await fetchPlanQuote(selectedPlan!.id, appliedCoupon);
        if (active) setQuote(q);
      } catch {
        // Fallback without coupon if coupon fails
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
      checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
      router.push("/dashboard");
    }, 2000);
  };

  if (success) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-emerald-500/30 bg-zinc-900/80 p-8 text-center shadow-2xl backdrop-blur">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400 mb-4 animate-bounce" />
        <h2 className="text-2xl font-extrabold text-white">Payment Successful!</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Your DarkGold Gym CRM subscription has been activated. Redirecting you to your dashboard...
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
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Transparent SaaS Pricing
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Choose the right plan for your gym
        </h1>
        <p className="text-sm sm:text-base text-zinc-400">
          Unlock unlimited member tracking, AI-powered analytics, automated fee receipts, and priority support.
        </p>
      </div>

      {error && (
        <div className="mx-auto max-w-xl rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-center text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Plans Grid */}
      {plansLoading ? (
        <div className="py-20 text-center text-zinc-400 text-sm">
          Loading subscription tiers...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((p) => {
            const isCurrent = subscription?.planName === p.name && subscription?.entitled;
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

      {/* Helper guide when no plan is selected */}
      {!selectedPlan && !plansLoading && (
        <div className="mx-auto max-w-xl text-center p-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40">
          <div className="inline-flex p-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Select a plan above to continue</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Click &quot;Select Plan&quot; on any subscription tier to unlock instant Razorpay checkout, discount coupons, and complete price breakdown.
          </p>
        </div>
      )}

      {/* Selected Plan Checkout Summary with Discount Card & Razorpay Button */}
      {selectedPlan && (
        <div
          ref={checkoutRef}
          className="mx-auto max-w-2xl rounded-2xl border border-amber-500/30 bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 sm:p-8 backdrop-blur shadow-2xl shadow-amber-500/10 space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Zap className="h-3 w-3" /> Selected Tier
                </span>
                <span className="text-xs text-zinc-400">
                  {selectedPlan.durationMonths === 1 ? "Monthly billing" : `${selectedPlan.durationMonths}-month billing`}
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-white mt-1.5 flex items-center gap-2">
                {selectedPlan.name} Plan
              </h3>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-3xl font-extrabold text-white">
                ₹{((quote?.pricing?.total ?? selectedPlan.pricePaise) / 100).toFixed(2)}
              </span>
              <span className="text-xs text-zinc-400 block mt-0.5">including 18% GST</span>
            </div>
          </div>

          {/* Discount Card & Coupon Section */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-zinc-200">Have a Discount Code?</span>
              </div>
              {appliedCoupon && (
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Coupon Active
                </span>
              )}
            </div>

            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Enter discount coupon (e.g. LAUNCH10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-700/80 pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 uppercase tracking-wider"
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                className="px-4 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                Apply
              </Button>
            </form>

            {appliedCoupon ? (
              <div className="flex items-center justify-between text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Coupon <strong>{appliedCoupon}</strong> applied successfully!
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode("");
                  }}
                  className="text-zinc-400 hover:text-white flex items-center gap-0.5 underline ml-2"
                >
                  <X className="h-3 w-3" /> Remove
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-zinc-500">Popular coupon:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCouponCode("LAUNCH10");
                    setAppliedCoupon("LAUNCH10");
                  }}
                  className="text-[11px] font-mono px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
                >
                  LAUNCH10 (10% OFF)
                </button>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          {quote?.pricing && (
            <div className="space-y-2.5 text-xs sm:text-sm text-zinc-400 border-t border-zinc-800/80 pt-4">
              <div className="flex justify-between">
                <span>Base Plan Price</span>
                <span className="text-zinc-200">₹{(quote.pricing.base / 100).toFixed(2)}</span>
              </div>
              {quote.pricing.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Coupon Discount ({appliedCoupon})</span>
                  <span>-₹{(quote.pricing.couponDiscount / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span className="text-zinc-200">₹{(quote.pricing.gst / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-800 pt-3 text-base font-bold text-white">
                <span>Total Amount Due</span>
                <span className="text-amber-400 text-lg">₹{(quote.pricing.total / 100).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Pay with Razorpay Button */}
          <div className="pt-2">
            <CheckoutButton
              plan={selectedPlan}
              couponCode={appliedCoupon}
              onSuccess={handlePaymentSuccess}
              onError={(err) => setError(err.message)}
            />
          </div>

          {/* Security & Guarantee Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 pt-2 border-t border-zinc-800/60">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Instant activation via Razorpay (UPI, Cards, NetBanking)</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPlan(null)}
              className="text-zinc-400 hover:text-white underline text-[11px]"
            >
              Choose different plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

