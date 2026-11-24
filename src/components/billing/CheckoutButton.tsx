"use client";

import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { openRazorpayModal } from "@/lib/razorpay";
import { createPlatformOrder, verifyPlatformPayment, type BillingPlan } from "@/lib/api/billing";
import { useSession } from "@/components/auth/SessionProvider";

type CheckoutButtonProps = {
  plan: BillingPlan;
  couponCode?: string | null;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
  className?: string;
  children?: React.ReactNode;
};

export function CheckoutButton({
  plan,
  couponCode,
  onSuccess,
  onError,
  className,
  children,
}: CheckoutButtonProps) {
  const { user } = useSession();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);

      // 1. Generate Order on the backend
      const orderRes = await createPlatformOrder(plan.id, couponCode);

      // 2. Open Razorpay Checkout Modal
      await openRazorpayModal({
        order: {
          keyId: orderRes.keyId,
          orderId: orderRes.orderId,
          amount: orderRes.amount,
          currency: orderRes.currency,
          planName: plan.name,
        },
        user: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
        },
        onDismiss: () => {
          setLoading(false);
        },
        onSuccess: async (razorpayResponse) => {
          try {
            // 3. Cryptographically verify signature on the server
            await verifyPlatformPayment({
              orderId: razorpayResponse.razorpay_order_id,
              paymentId: razorpayResponse.razorpay_payment_id,
              signature: razorpayResponse.razorpay_signature,
            });

            onSuccess?.();
          } catch (verifyError: unknown) {
            onError?.(verifyError instanceof Error ? verifyError : new Error(String(verifyError)));
          } finally {
            setLoading(false);
          }
        },
        onError: (modalError) => {
          setLoading(false);
          onError?.(modalError);
        },
      });
    } catch (err: unknown) {
      setLoading(false);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  return (
    <Button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      className={className || "w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl shadow-lg shadow-amber-500/20"}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Preparing Payment...
        </span>
      ) : (
        children || (
          <span className="inline-flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Pay with Razorpay
          </span>
        )
      )}
    </Button>
  );
}
