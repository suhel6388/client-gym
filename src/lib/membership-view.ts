import type { BadgeTone } from "./member-ui";
import {
  getInitials,
  type MembershipStatusDto,
  type MembershipWithRelationsDto,
  type PaymentDto,
} from "./members-api";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Window (in days) before expiry in which a membership is flagged "Expiring". */
export const EXPIRING_WINDOW_DAYS = 14;

/** UI-facing subscription status, derived from `effectiveStatus` + dates. */
export type SubscriptionStatus =
  | "Active"
  | "Expiring"
  | "Expired"
  | "Frozen"
  | "Cancelled"
  | "Inactive";

const SUBSCRIPTION_TONES: Record<SubscriptionStatus, BadgeTone> = {
  Active: "success",
  Expiring: "warning",
  Expired: "danger",
  Frozen: "neutral",
  Cancelled: "muted",
  Inactive: "muted",
};

export function subscriptionTone(status: SubscriptionStatus): BadgeTone {
  return SUBSCRIPTION_TONES[status] ?? "neutral";
}

/**
 * UI-facing payment status for a membership, derived from the fee owed vs. the
 * payments attributed to the membership window. The backend has no dedicated
 * payment-status field, so it is computed here.
 */
export type PaymentStatus = "Paid" | "Partial" | "Due";

const PAYMENT_STATUS_TONES: Record<PaymentStatus, BadgeTone> = {
  Paid: "success",
  Partial: "warning",
  Due: "danger",
};

export function paymentTone(status: PaymentStatus): BadgeTone {
  return PAYMENT_STATUS_TONES[status] ?? "neutral";
}

export function paymentStatusFor(
  row: Pick<SubscriptionRow, "feePaise" | "paidPaise" | "balancePaise">,
): PaymentStatus {
  if (row.balancePaise <= 0) return "Paid";
  if (row.paidPaise <= 0) return "Due";
  return "Partial";
}

/** Date-window presets used by the expiry filter on the records table. */
export type ExpiryFilter = "All" | "Today" | "7" | "30" | "Expired";

/** Whole days from now until the given ISO date (negative once past). */
export function daysUntil(iso: string): number {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return 0;
  return Math.ceil((time - Date.now()) / DAY_MS);
}

/** Net fee for a membership, in paise, clamped at zero. */
export function membershipFeePaise(
  membership: Pick<MembershipWithRelationsDto, "pricePaise" | "discountPaise">,
): number {
  return Math.max(0, membership.pricePaise - membership.discountPaise);
}

/** Normalizes a membership's price to an equivalent monthly value, in paise. */
export function monthlyValuePaise(
  membership: Pick<MembershipWithRelationsDto, "pricePaise" | "discountPaise" | "plan">,
): number {
  const months = Math.max(1, membership.plan?.durationMonths ?? 1);
  return Math.round(membershipFeePaise(membership) / months);
}

export function toSubscriptionStatus(
  membership: MembershipWithRelationsDto,
): SubscriptionStatus {
  const status: MembershipStatusDto = membership.effectiveStatus ?? membership.status;
  if (status === "FROZEN") return "Frozen";
  if (status === "CANCELLED") return "Cancelled";
  if (status === "INACTIVE") return "Inactive";
  const left = daysUntil(membership.endDate);
  if (left < 0) return "Expired";
  if (left <= EXPIRING_WINDOW_DAYS) return "Expiring";
  return "Active";
}

export type SubscriptionRow = {
  id: string;
  memberId: string;
  memberName: string;
  memberInitials: string;
  memberCode: string;
  memberPhone: string;
  planId: string;
  planName: string;
  durationMonths: number;
  startDate: string;
  endDate: string;
  effectiveStatus: MembershipStatusDto;
  status: SubscriptionStatus;
  /** Net fee owed for this membership, in paise. */
  feePaise: number;
  /** Payments attributed to this membership's window, in paise. */
  paidPaise: number;
  /** Outstanding balance for this membership, in paise. */
  balancePaise: number;
  daysLeft: number;
  raw: MembershipWithRelationsDto;
};

/**
 * Groups successful payments by member so they can be attributed to a
 * membership. Payments are attributed by date window, since the backend does
 * not (yet) allocate payments to a specific membership.
 */
export function groupPaymentsByMember(
  payments: PaymentDto[],
): Map<string, PaymentDto[]> {
  const map = new Map<string, PaymentDto[]>();
  for (const payment of payments) {
    if (payment.status && payment.status.toUpperCase() !== "SUCCESS") continue;
    const list = map.get(payment.memberId);
    if (list) list.push(payment);
    else map.set(payment.memberId, [payment]);
  }
  return map;
}

function sumPaymentsInWindow(
  payments: PaymentDto[] | undefined,
  startDate: string,
  endDate: string,
): number {
  if (!payments?.length) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  let total = 0;
  for (const payment of payments) {
    const at = new Date(payment.paymentDate ?? payment.paidAt).getTime();
    if (Number.isNaN(at)) continue;
    if (at >= start && at <= end) total += payment.amount;
  }
  return total;
}

export function toSubscriptionRow(
  membership: MembershipWithRelationsDto,
  paymentsByMember: Map<string, PaymentDto[]>,
): SubscriptionRow {
  const feePaise = membershipFeePaise(membership);
  const paidPaise = sumPaymentsInWindow(
    paymentsByMember.get(membership.memberId),
    membership.startDate,
    membership.endDate,
  );
  return {
    id: membership.id,
    memberId: membership.memberId,
    memberName: membership.member?.name ?? "Unknown member",
    memberInitials: getInitials(membership.member?.name ?? "?"),
    memberCode: membership.member?.memberCode ?? "—",
    memberPhone: membership.member?.phone ?? "—",
    planId: membership.planId,
    planName: membership.plan?.name ?? "—",
    durationMonths: membership.plan?.durationMonths ?? 0,
    startDate: membership.startDate,
    endDate: membership.endDate,
    effectiveStatus: membership.effectiveStatus ?? membership.status,
    status: toSubscriptionStatus(membership),
    feePaise,
    paidPaise,
    balancePaise: Math.max(0, feePaise - paidPaise),
    daysLeft: daysUntil(membership.endDate),
    raw: membership,
  };
}
