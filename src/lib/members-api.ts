/**
 * View-model helpers for members, plans and payments.
 *
 * All HTTP requests live in `src/lib/api.ts`; this module only re-exports the
 * endpoint functions/types for existing feature imports and keeps the pure
 * mapping helpers used by the UI.
 */

import type {
  MemberDto,
  MembershipDto,
  MembershipWithRelationsDto,
} from "./api";

export type {
  CreatePlanInput,
  MemberDto,
  MemberInput,
  MembershipDto,
  MembershipMemberDto,
  MembershipStatusDto,
  MembershipWithRelationsDto,
  PaymentDto,
  PaymentInput,
  PaymentModeDto,
  PlanDto,
  TimingDto,
  UpdatePlanInput,
} from "./api";

export {
  archiveMember,
  cancelMembership,
  createMember,
  createMembership,
  createPayment,
  createPlan,
  deactivatePlan,
  freezeMembership,
  listMembers,
  listMemberships,
  listPayments,
  listPlans,
  updateMember,
  updatePlan,
} from "./api";

export type MemberStatus = "Active" | "Expiring" | "Inactive" | "Frozen";

export type MemberRow = {
  id: string;
  code: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  plan: string;
  planId: string | null;
  status: MemberStatus;
  joined: string;
  nextDue: string | null;
  membership: MembershipDto | null;
  raw: MemberDto;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Maps the latest membership to a UI status. */
export function deriveStatus(membership: MembershipDto | null): MemberStatus {
  if (!membership) return "Inactive";
  if (membership.status === "FROZEN") return "Frozen";
  if (membership.status === "EXPIRED") return "Inactive";
  if (membership.status === "CANCELLED" || membership.status === "INACTIVE") {
    return "Inactive";
  }
  const remaining = new Date(membership.endDate).getTime() - Date.now();
  if (remaining < 0) return "Inactive";
  if (remaining <= 14 * DAY_MS) return "Expiring";
  return "Active";
}

export function toMemberRow(member: MemberDto): MemberRow {
  const membership = member.memberships?.[0] ?? null;
  return {
    id: member.id,
    code: member.memberCode,
    name: member.name,
    initials: getInitials(member.name),
    email: member.email ?? "",
    phone: member.phone,
    plan: membership?.plan?.name ?? "No plan",
    planId: membership?.plan?.id ?? null,
    status: deriveStatus(membership),
    joined: member.joinedAt,
    nextDue: membership?.endDate ?? null,
    membership,
    raw: member,
  };
}

/** Membership rows returned by GET /memberships always include the member. */
export function toMembershipRow(
  membership: MembershipWithRelationsDto,
): MembershipWithRelationsDto {
  return membership;
}

/* -- Money helpers -------------------------------------------------------- */

/** Backend prices are stored in paise (minor units). */
export function paiseToAmount(paise: number): number {
  return paise / 100;
}

export function amountToPaise(amount: number): number {
  return Math.round(amount * 100);
}

/** Adds calendar months to an ISO date, returning a new ISO string. */
export function addMonths(iso: string, months: number): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = date.getDate();
  date.setMonth(date.getMonth() + months);
  // Guard against month overflow (e.g. Jan 31 + 1 month).
  if (date.getDate() < day) date.setDate(0);
  return date.toISOString();
}
