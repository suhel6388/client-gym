/**
 * Presentation helpers for the platform-owner console.
 *
 * Kept separate from `lib/api.ts` so the HTTP layer stays free of UI labels and
 * the dashboard, gym table and detail page all render statuses the same way.
 */

import type { BadgeTone } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import type {
  PlatformSubscriptionStatus,
  SubscriptionPlan,
} from "@/lib/api";

type StatusMeta = { label: string; tone: BadgeTone; description: string };

const STATUS_META: Record<PlatformSubscriptionStatus, StatusMeta> = {
  ACTIVE: {
    label: "Active",
    tone: "success",
    description: "Paid subscription with access",
  },
  TRIALING: {
    label: "On trial",
    tone: "gold",
    description: "Free trial in progress",
  },
  EXPIRED: {
    label: "Expired",
    tone: "danger",
    description: "Billing period ended",
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "neutral",
    description: "Cancellation recorded",
  },
  PAST_DUE: {
    label: "Past due",
    tone: "warning",
    description: "Payment needs attention",
  },
  SUSPENDED: {
    label: "Suspended",
    tone: "danger",
    description: "Access blocked by platform admin",
  },
  NO_SUBSCRIPTION: {
    label: "No subscription",
    tone: "muted",
    description: "No billing record yet",
  },
};

export function platformStatusMeta(status: PlatformSubscriptionStatus): StatusMeta {
  return STATUS_META[status] ?? STATUS_META.NO_SUBSCRIPTION;
}

/** Amounts are stored as integer paise; the UI displays rupees. */
export function formatPaise(paise: number | null | undefined): string {
  return formatCurrency(Math.round(Number(paise ?? 0)) / 100);
}

export function formatPlanPrice(plan: SubscriptionPlan | null | undefined): string {
  if (!plan) return "Free trial";
  return `${formatPaise(plan.pricePaise)} / ${plan.durationMonths} mo`;
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** `null`-safe date label for ISO timestamps returned by the API. */
export function formatPlatformDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export function formatPlatformDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

/** Compact "3d ago" label for audit feeds. */
export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatPlatformDate(value);
}

export function platformInitials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

const ACTION_LABELS: Record<string, string> = {
  SUBSCRIPTION_PLAN_ASSIGNED: "Plan assigned",
  SUBSCRIPTION_PLAN_CHANGED: "Plan changed",
  SUBSCRIPTION_EXTENDED: "Expiry extended",
  TRIAL_STARTED: "Trial started",
  TRIAL_EXTENDED: "Trial extended",
  TRIAL_ENDED: "Trial ended",
  GYM_SUSPENDED: "Gym suspended",
  GYM_ACTIVATED: "Gym activated",
  SUBSCRIPTION_CANCELLED: "Subscription cancelled",
  SUBSCRIPTION_ACTIVATED: "Subscription activated",
  PLAN_CREATED: "Plan created",
  PLAN_UPDATED: "Plan updated",
  PLAN_STATUS_CHANGED: "Plan status changed",
  SETTINGS_UPDATED: "Settings updated",
  PAYMENT_SUCCEEDED: "Payment succeeded",
  PAYMENT_FAILED: "Payment failed",
};

export function auditActionLabel(action: string): string {
  return (
    ACTION_LABELS[action] ??
    action
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

export function auditActionTone(action: string): BadgeTone {
  if (action.includes("SUSPEND") || action.includes("FAILED")) return "danger";
  if (action.includes("TRIAL")) return "gold";
  if (action.includes("END") || action.includes("CANCEL")) return "warning";
  if (action.includes("ACTIV") || action.includes("ASSIGN") || action.includes("EXTEND")) {
    return "success";
  }
  return "neutral";
}

const ENTITLEMENT_REASONS: Record<string, string> = {
  TRIAL_ACTIVE: "Trial active",
  TRIAL_EXPIRED: "Trial expired",
  ACTIVE: "Paid period active",
  PERIOD_ACTIVE: "Paid period active",
  PERIOD_ENDED: "Paid period ended",
  CANCELLED_AT_PERIOD_END: "Cancelled — access until period end",
  CANCELLED_EXPIRED: "Cancelled and expired",
  CANCELLED_IMMEDIATE: "Cancelled immediately",
  SUSPENDED: "Suspended by platform admin",
  PAST_DUE: "Payment past due",
  NO_SUBSCRIPTION: "No subscription on record",
};

export function entitlementLabel(reason: string | null | undefined): string {
  if (!reason) return "No entitlement";
  return (
    ENTITLEMENT_REASONS[reason] ??
    reason
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/^\w/, (character) => character.toUpperCase())
  );
}
