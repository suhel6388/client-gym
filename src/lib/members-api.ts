import { apiRequest } from "./api";

/* -- API DTOs ------------------------------------------------------------- */

export type MembershipStatusDto =
  | "ACTIVE"
  | "EXPIRED"
  | "INACTIVE"
  | "FROZEN"
  | "CANCELLED";

export type PaymentModeDto =
  | "CASH"
  | "UPI"
  | "BANK_TRANSFER"
  | "CARD"
  | "OTHER";

export type TimingDto = "MORNING" | "AFTERNOON" | "EVENING";

export type PlanDto = {
  id: string;
  gymId: string;
  name: string;
  durationMonths: number;
  pricePaise: number;
  isActive: boolean;
  createdAt: string;
};

export type MembershipDto = {
  id: string;
  gymId: string;
  memberId: string;
  planId: string;
  startDate: string;
  endDate: string;
  pricePaise: number;
  discountPaise: number;
  status: MembershipStatusDto;
  frozenAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  plan: PlanDto;
};

/** Trimmed member shape embedded on a membership row (`include: { member: true }`). */
export type MembershipMemberDto = {
  id: string;
  memberCode: string;
  name: string;
  phone: string;
  email: string | null;
  archivedAt: string | null;
};

/**
 * Membership as returned by `GET /memberships`: the base row plus the related
 * member and a server-computed `effectiveStatus` (ACTIVE rows past their end
 * date are reported as EXPIRED).
 */
export type MembershipWithRelationsDto = MembershipDto & {
  member: MembershipMemberDto;
  effectiveStatus: MembershipStatusDto;
};

/** Payment as returned by `GET /payments`. `amount` is stored in paise. */
export type PaymentDto = {
  id: string;
  gymId: string;
  memberId: string;
  /** Amount in paise (minor units), matching how it was written. */
  amount: number;
  paymentMode: PaymentModeDto;
  receiptNumber: string;
  reference: string | null;
  paymentDate: string;
  paidAt: string;
  status: string;
  member?: { id: string; name: string; memberCode: string };
};

export type MemberDto = {
  id: string;
  gymId: string;
  memberCode: string;
  name: string;
  phone: string;
  email: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  joinedAt: string;
  timing: TimingDto;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  memberships: MembershipDto[];
};

export type MemberInput = {
  memberCode?: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  joinedAt?: string;
  timing?: TimingDto;
  notes?: string | null;
};

export type MembershipInput = {
  memberId: string;
  planId: string;
  startDate?: string;
  discountPaise?: number;
};

export type PaymentInput = {
  memberId: string;
  /** Amount in paise (minor units). */
  amount: number;
  paymentMode: PaymentModeDto;
  reference?: string | null;
  paymentDate?: string;
  status?: string;
};

export type CreatePlanInput = {
  name: string;
  /** Price in paise (minor units). */
  pricePaise: number;
  durationMonths: number;
  isActive?: boolean;
};

export type UpdatePlanInput = Partial<CreatePlanInput>;

/* -- Requests ------------------------------------------------------------- */

export function listMembers(signal?: AbortSignal): Promise<MemberDto[]> {
  return apiRequest<MemberDto[]>("/members", { signal });
}

export function createMember(
  input: MemberInput,
  signal?: AbortSignal,
): Promise<MemberDto> {
  return apiRequest<MemberDto>("/members", { method: "POST", body: input, signal });
}

export function updateMember(
  id: string,
  input: Partial<MemberInput>,
  signal?: AbortSignal,
): Promise<MemberDto> {
  return apiRequest<MemberDto>(`/members/${id}`, {
    method: "PATCH",
    body: input,
    signal,
  });
}

export function archiveMember(id: string, signal?: AbortSignal): Promise<unknown> {
  return apiRequest(`/members/${id}`, { method: "DELETE", signal });
}

export function listPlans(signal?: AbortSignal): Promise<PlanDto[]> {
  return apiRequest<PlanDto[]>("/plans", { signal });
}

export function createPlan(
  input: CreatePlanInput,
  signal?: AbortSignal,
): Promise<PlanDto> {
  return apiRequest<PlanDto>("/plans", { method: "POST", body: input, signal });
}

export function updatePlan(
  id: string,
  input: UpdatePlanInput,
  signal?: AbortSignal,
): Promise<PlanDto> {
  return apiRequest<PlanDto>(`/plans/${id}`, {
    method: "PATCH",
    body: input,
    signal,
  });
}

/** Soft-deletes a plan by marking it inactive. */
export function deactivatePlan(id: string, signal?: AbortSignal): Promise<unknown> {
  return apiRequest(`/plans/${id}`, { method: "DELETE", signal });
}

export function createMembership(
  input: MembershipInput,
): Promise<MembershipDto> {
  return apiRequest<MembershipDto>("/memberships", { method: "POST", body: input });
}

export function listMemberships(
  params?: { status?: MembershipStatusDto },
  signal?: AbortSignal,
): Promise<MembershipWithRelationsDto[]> {
  return apiRequest<MembershipWithRelationsDto[]>("/memberships", {
    query: params?.status ? { status: params.status } : undefined,
    signal,
  });
}

export function freezeMembership(id: string): Promise<unknown> {
  return apiRequest(`/memberships/${id}/freeze`, { method: "POST" });
}

export function cancelMembership(id: string): Promise<unknown> {
  return apiRequest(`/memberships/${id}/cancel`, { method: "POST" });
}

export function createPayment(input: PaymentInput): Promise<unknown> {
  return apiRequest("/payments", { method: "POST", body: input });
}

export function listPayments(signal?: AbortSignal): Promise<PaymentDto[]> {
  return apiRequest<PaymentDto[]>("/payments", { signal });
}

/* -- Derived view model --------------------------------------------------- */

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
