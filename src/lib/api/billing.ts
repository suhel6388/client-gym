import { apiRequest } from "@/lib/api";

export type BillingPlan = {
  id: string;
  code: string;
  slug?: string | null;
  name: string;
  description?: string | null;
  pricePaise: number;
  currency: string;
  durationDays?: number | null;
  durationMonths: number;
  gstPercent?: number;
  discountPaise?: number;
  features: string[];
  isActive?: boolean;
  displayOrder?: number;
  maxStaff?: number | null;
  maxBranches?: number | null;
};

export type PricingQuote = {
  plan: BillingPlan;
  pricing: {
    base: number;
    discount: number;
    couponDiscount: number;
    taxableAmount: number;
    gst: number;
    total: number;
    gstPercent: number;
  };
  coupon?: {
    code: string;
    percent: number;
    maxDiscountPaise?: number | null;
  } | null;
};

export type PlatformOrderResponse = {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  status: string;
  reused?: boolean;
  plan: BillingPlan;
  amountBreakdown?: Record<string, unknown>;
};

export type VerifyPaymentResponse = {
  subscription: {
    id: string;
    status: string;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    trialStartsAt?: string | null;
    trialEndsAt?: string | null;
    plan?: BillingPlan | null;
  };
  payment: {
    id: string;
    status: string;
    verifiedAt?: string | null;
  };
  alreadyVerified: boolean;
};

export type SubscriptionSummary = {
  id: string;
  status: "TRIALING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "SUSPENDED" | "PAST_DUE";
  entitled: boolean;
  reason: string;
  remainingDays: number;
  isTrial: boolean;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  graceEndsAt?: string | null;
  planName?: string | null;
  pricePaise?: number;
  currency?: string;
  cancelAtPeriodEnd?: boolean;
};

export type SubscriptionHistoryItem = {
  id: string;
  orderId?: string | null;
  paymentId?: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  verifiedAt?: string | null;
  planName?: string | null;
  plan?: BillingPlan | null;
};

export type PlatformPaymentDetail = {
  id: string;
  gymId: string;
  gymName?: string | null;
  orderId?: string | null;
  paymentId?: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  verifiedAt?: string | null;
  planName?: string | null;
  plan?: BillingPlan | null;
  gym?: { id: string; name: string } | null;
};

// ---------------------------------------------------------------------------
// Gym Owner Billing Endpoints
// ---------------------------------------------------------------------------

/** GET /platform/plans — list active plans with features */
export function fetchBillingPlans(signal?: AbortSignal) {
  return apiRequest<BillingPlan[]>("/platform/plans", { signal });
}

/** POST /platform/plans/:id/quote — get calculated pricing with optional coupon */
export function fetchPlanQuote(planId: string, couponCode?: string | null) {
  return apiRequest<PricingQuote>(`/platform/plans/${planId}/quote`, {
    method: "POST",
    body: { couponCode: couponCode?.trim() || null },
  });
}

/** POST /platform/payments/create-order — generate Razorpay Order on server */
export function createPlatformOrder(planId: string, couponCode?: string | null) {
  return apiRequest<PlatformOrderResponse>("/platform/payments/create-order", {
    method: "POST",
    body: {
      planId,
      couponCode: couponCode?.trim() || null,
    },
  });
}

/** POST /platform/payments/verify — verify signature & activate subscription */
export function verifyPlatformPayment(payload: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  return apiRequest<VerifyPaymentResponse>("/platform/payments/verify", {
    method: "POST",
    body: payload,
  });
}

/** GET /platform/subscription/summary — live entitlement & remaining days */
export function fetchSubscriptionSummary(signal?: AbortSignal) {
  return apiRequest<SubscriptionSummary>("/platform/subscription/summary", { signal });
}

/** GET /platform/subscription — full current subscription record */
export function fetchMySubscription(signal?: AbortSignal) {
  return apiRequest<Record<string, unknown>>("/platform/subscription", { signal });
}

/** GET /platform/payments — authenticated gym's payment ledger */
export function fetchPaymentHistory(page = 1, limit = 20) {
  return apiRequest<{
    data: SubscriptionHistoryItem[];
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  }>(`/platform/payments?page=${page}&limit=${limit}`, { unwrap: false });
}

/** POST /subscription/cancel — cancel at end of current period */
export function cancelMySubscription() {
  return apiRequest<{
    subscriptionId: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string;
  }>("/subscription/cancel", { method: "POST", body: {} });
}

// ---------------------------------------------------------------------------
// Super-Admin Plan & Payment Management Endpoints
// ---------------------------------------------------------------------------

/** GET /platform/admin/plans */
export function listAdminPlans(signal?: AbortSignal) {
  return apiRequest<BillingPlan[]>("/platform/admin/plans", { signal });
}

/** POST /platform/admin/plans */
export function createAdminPlan(payload: Partial<BillingPlan>) {
  return apiRequest<BillingPlan>("/platform/admin/plans", {
    method: "POST",
    body: payload,
  });
}

/** PATCH /platform/admin/plans/:id */
export function updateAdminPlan(id: string, payload: Partial<BillingPlan>) {
  return apiRequest<BillingPlan>(`/platform/admin/plans/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

/** PATCH /platform/admin/plans/:id/status */
export function toggleAdminPlanStatus(id: string, isActive: boolean) {
  return apiRequest<{ id: string; isActive: boolean }>(`/platform/admin/plans/${id}/status`, {
    method: "PATCH",
    body: { isActive },
  });
}

/** DELETE /platform/admin/plans/:id */
export function deleteAdminPlan(id: string) {
  return apiRequest<{ success: boolean; id: string }>(`/platform/admin/plans/${id}`, {
    method: "DELETE",
  });
}

/** GET /platform/admin/payments */
export function listAllPlatformPayments(params: {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);

  return apiRequest<{
    data: PlatformPaymentDetail[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/platform/admin/payments?${query.toString()}`, { unwrap: false });
}

/** GET /platform/admin/payments/:id */
export function getPlatformPaymentDetails(id: string) {
  return apiRequest<PlatformPaymentDetail>(`/platform/admin/payments/${id}`);
}

/** Super Admin Gym Actions */
export function adminExtendGymTrial(gymId: string, additionalDays: number, reason: string) {
  return apiRequest(`/super-admin/gyms/${gymId}/trial`, {
    method: "POST",
    body: { additionalDays, reason },
  });
}

export function adminGrantGymAccess(gymId: string, expiresAt: string, reason: string) {
  return apiRequest(`/super-admin/gyms/${gymId}/extend-expiry`, {
    method: "POST",
    body: { expiresAt, reason },
  });
}

export function adminAssignGymPlan(gymId: string, planId: string, reason: string) {
  return apiRequest(`/super-admin/gyms/${gymId}/plan`, {
    method: "POST",
    body: { planId, reason },
  });
}

export function adminToggleGymAccess(gymId: string, suspended: boolean, reason: string) {
  return apiRequest(`/super-admin/gyms/${gymId}/access`, {
    method: "PATCH",
    body: { suspended, reason },
  });
}
