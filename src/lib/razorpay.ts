/**
 * Razorpay Checkout SDK loader and modal manager.
 *
 * SECURITY:
 *   - Only public keyId is handled here (never secrets).
 *   - Returns orderId, paymentId and signature on completion for server-side HMAC verification.
 */

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (res: { error?: Record<string, unknown> }) => void) => void;
    };
  }
}

export type RazorpayOrderData = {
  keyId: string;
  orderId: string;
  amount: number; // in paise
  currency?: string;
  planName?: string;
};

export type RazorpayUserProfile = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

/** Dynamically loads checkout.js if not already present on window. */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existingScript = document.getElementById("razorpay-checkout-sdk");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/** Opens the Razorpay payment modal with unified styling. */
export async function openRazorpayModal({
  order,
  user,
  onSuccess,
  onDismiss,
  onError,
}: {
  order: RazorpayOrderData;
  user?: RazorpayUserProfile;
  onSuccess: (result: RazorpaySuccessResponse) => void | Promise<void>;
  onDismiss?: () => void;
  onError?: (error: Error) => void;
}): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    const err = new Error("Unable to load Razorpay SDK. Please check your internet connection.");
    onError?.(err);
    throw err;
  }

  const options: Record<string, unknown> = {
    key: order.keyId,
    amount: order.amount,
    currency: order.currency || "INR",
    name: "DarkGold Gym CRM",
    description: order.planName ? `Subscription: ${order.planName}` : "Platform Subscription",
    image: "/logo.png",
    order_id: order.orderId,
    prefill: {
      name: user?.name || "",
      email: user?.email || "",
      contact: user?.phone || "",
    },
    theme: {
      color: "#D97706", // DarkGold amber/gold accent
    },
    modal: {
      ondismiss: () => {
        onDismiss?.();
      },
    },
    handler: (response: RazorpaySuccessResponse) => {
      onSuccess(response);
    },
  };

  const rzp = new window.Razorpay(options);

  rzp.on("payment.failed", (response) => {
    const description = (response?.error?.description as string) || "Payment transaction failed";
    onError?.(new Error(description));
  });

  rzp.open();
}
