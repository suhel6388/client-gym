import type {
  MemberDto,
  MembershipWithRelationsDto,
  PaymentDto,
  PlanDto,
} from "./members-api";
import type { ExpenseDto } from "./expenses-api";

/**
 * Dummy data for the Reports & Analytics page.
 *
 * The backend report/member/payment routes are not usable right now
 * (see API guide "Current integration blockers"), so the page renders
 * from this static dataset instead of calling the API.
 *
 * AXIOS-READY: when the backend is fixed, flip `REPORTS_USE_MOCK` to
 * `false` in `reports-service.ts` — the axios calls in
 * `members-api.ts` / `expenses-api.ts` (via `src/lib/api.ts`) are kept
 * intact and need no changes.
 */

const GYM_ID = "gym-dummy-01";

function isoDaysAgo(daysAgo: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
}

function dateKeyDaysAgo(daysAgo: number): string {
  return isoDaysAgo(daysAgo).slice(0, 10);
}

const PLANS: PlanDto[] = [
  {
    id: "plan-monthly",
    gymId: GYM_ID,
    name: "Monthly",
    durationMonths: 1,
    pricePaise: 250000,
    isActive: true,
    createdAt: isoDaysAgo(200),
  },
  {
    id: "plan-quarterly",
    gymId: GYM_ID,
    name: "Quarterly",
    durationMonths: 3,
    pricePaise: 650000,
    isActive: true,
    createdAt: isoDaysAgo(200),
  },
  {
    id: "plan-yearly",
    gymId: GYM_ID,
    name: "Yearly",
    durationMonths: 12,
    pricePaise: 2200000,
    isActive: true,
    createdAt: isoDaysAgo(200),
  },
];

function planById(id: string): PlanDto {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

type MockMemberSeed = {
  id: string;
  code: string;
  name: string;
  phone: string;
  joinedDaysAgo: number;
};

const MEMBER_SEEDS: MockMemberSeed[] = [
  { id: "mem-01", code: "GYM-0101", name: "Rahul Sharma", phone: "9876543210", joinedDaysAgo: 80 },
  { id: "mem-02", code: "GYM-0102", name: "Aman Verma", phone: "9123456780", joinedDaysAgo: 65 },
  { id: "mem-03", code: "GYM-0103", name: "Priya Nair", phone: "9988776655", joinedDaysAgo: 40 },
  { id: "mem-04", code: "GYM-0104", name: "Vikram Singh", phone: "9812345678", joinedDaysAgo: 25 },
  { id: "mem-05", code: "GYM-0105", name: "Sneha Patel", phone: "9765432109", joinedDaysAgo: 12 },
  { id: "mem-06", code: "GYM-0106", name: "Arjun Mehta", phone: "9654321098", joinedDaysAgo: 5 },
  { id: "mem-07", code: "GYM-0107", name: "Kavya Reddy", phone: "9543210987", joinedDaysAgo: 2 },
  { id: "mem-08", code: "GYM-0108", name: "Rohan Das", phone: "9432109876", joinedDaysAgo: 0 },
];

type MembershipSeed = {
  id: string;
  memberId: string;
  planId: string;
  startDaysAgo: number;
  status: MembershipWithRelationsDto["status"];
  discountPaise?: number;
};

/**
 * Dates are relative to today so every range preset (Today / Week /
 * Month / Last 3 months / Year) shows data. Statuses cover Active,
 * Expiring (<14 days left), Expired, Frozen and Cancelled.
 */
const MEMBERSHIP_SEEDS: MembershipSeed[] = [
  // Active yearly started 40 days ago
  { id: "ms-01", memberId: "mem-01", planId: "plan-yearly", startDaysAgo: 40, status: "ACTIVE" },
  // Active quarterly started 25 days ago
  { id: "ms-02", memberId: "mem-02", planId: "plan-quarterly", startDaysAgo: 65, status: "ACTIVE" },
  // Expiring: monthly started ~25 days ago, ends in ~5 days
  { id: "ms-03", memberId: "mem-03", planId: "plan-monthly", startDaysAgo: 25, status: "ACTIVE" },
  // Expiring: monthly started ~28 days ago, ends in ~2 days
  { id: "ms-04", memberId: "mem-04", planId: "plan-monthly", startDaysAgo: 28, status: "ACTIVE" },
  // Active monthly started 12 days ago
  { id: "ms-05", memberId: "mem-05", planId: "plan-monthly", startDaysAgo: 12, status: "ACTIVE" },
  // Active monthly started 5 days ago (new + renewal example below reuses mem-01)
  { id: "ms-06", memberId: "mem-06", planId: "plan-quarterly", startDaysAgo: 5, status: "ACTIVE" },
  // Renewal: second membership for mem-01 started 2 days ago
  { id: "ms-07", memberId: "mem-01", planId: "plan-monthly", startDaysAgo: 2, status: "ACTIVE", discountPaise: 20000 },
  // Frozen
  { id: "ms-08", memberId: "mem-07", planId: "plan-monthly", startDaysAgo: 20, status: "FROZEN" },
  // Cancelled
  { id: "ms-09", memberId: "mem-08", planId: "plan-monthly", startDaysAgo: 10, status: "CANCELLED" },
  // Expired old membership for renewal detection (mem-02 had an earlier term)
  { id: "ms-10", memberId: "mem-02", planId: "plan-monthly", startDaysAgo: 120, status: "EXPIRED" },
];

function addMonthsIso(iso: string, months: number): string {
  const d = new Date(iso);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d.toISOString();
}

function seedToMembership(seed: MembershipSeed): MembershipWithRelationsDto {
  const memberSeed = MEMBER_SEEDS.find((m) => m.id === seed.memberId)!;
  const plan = planById(seed.planId);
  const startDate = isoDaysAgo(seed.startDaysAgo, 9);
  const endDate = addMonthsIso(startDate, plan.durationMonths);
  return {
    id: seed.id,
    gymId: GYM_ID,
    memberId: seed.memberId,
    planId: seed.planId,
    startDate,
    endDate,
    pricePaise: plan.pricePaise,
    discountPaise: seed.discountPaise ?? 0,
    status: seed.status,
    frozenAt: seed.status === "FROZEN" ? isoDaysAgo(3) : null,
    cancelledAt: seed.status === "CANCELLED" ? isoDaysAgo(1) : null,
    createdAt: startDate,
    plan,
    member: {
      id: memberSeed.id,
      memberCode: memberSeed.code,
      name: memberSeed.name,
      phone: memberSeed.phone,
      email: null,
      archivedAt: null,
    },
    effectiveStatus: seed.status,
  };
}

export const MOCK_MEMBERSHIPS: MembershipWithRelationsDto[] =
  MEMBERSHIP_SEEDS.map(seedToMembership);

export const MOCK_MEMBERS: MemberDto[] = MEMBER_SEEDS.map((seed, index) => {
  const memberships = MOCK_MEMBERSHIPS.filter((m) => m.memberId === seed.id).map(
    ({ member, effectiveStatus, ...rest }) => rest,
  );
  return {
    id: seed.id,
    gymId: GYM_ID,
    memberCode: seed.code,
    name: seed.name,
    phone: seed.phone,
    email: null,
    dateOfBirth: null,
    gender: null,
    address: null,
    emergencyContact: null,
    emergencyPhone: null,
    joinedAt: isoDaysAgo(seed.joinedDaysAgo, 9),
    timing: (["MORNING", "EVENING", "AFTERNOON"] as const)[index % 3],
    notes: null,
    archivedAt: null,
    createdAt: isoDaysAgo(seed.joinedDaysAgo, 9),
    updatedAt: isoDaysAgo(Math.max(0, seed.joinedDaysAgo - 1), 9),
    memberships,
  };
});

type PaymentSeed = {
  id: string;
  memberId: string;
  amountPaise: number;
  mode: PaymentDto["paymentMode"];
  daysAgo: number;
  status?: string;
};

const PAYMENT_SEEDS: PaymentSeed[] = [
  { id: "pay-01", memberId: "mem-01", amountPaise: 2200000, mode: "UPI", daysAgo: 40 },
  { id: "pay-02", memberId: "mem-02", amountPaise: 650000, mode: "CARD", daysAgo: 65 },
  { id: "pay-03", memberId: "mem-03", amountPaise: 250000, mode: "CASH", daysAgo: 25 },
  { id: "pay-04", memberId: "mem-04", amountPaise: 250000, mode: "UPI", daysAgo: 28 },
  { id: "pay-05", memberId: "mem-02", amountPaise: 250000, mode: "BANK_TRANSFER", daysAgo: 120, status: "SUCCESS" },
  { id: "pay-06", memberId: "mem-05", amountPaise: 250000, mode: "UPI", daysAgo: 12 },
  { id: "pay-07", memberId: "mem-06", amountPaise: 650000, mode: "CASH", daysAgo: 5 },
  { id: "pay-08", memberId: "mem-01", amountPaise: 230000, mode: "UPI", daysAgo: 2 },
  { id: "pay-09", memberId: "mem-07", amountPaise: 125000, mode: "CASH", daysAgo: 3 },
  { id: "pay-10", memberId: "mem-05", amountPaise: 50000, mode: "OTHER", daysAgo: 1, status: "PENDING" },
  { id: "pay-11", memberId: "mem-08", amountPaise: 250000, mode: "CARD", daysAgo: 0 },
  { id: "pay-12", memberId: "mem-04", amountPaise: 100000, mode: "UPI", daysAgo: 8 },
];

export const MOCK_PAYMENTS: PaymentDto[] = PAYMENT_SEEDS.map((seed, i) => {
  const member = MEMBER_SEEDS.find((m) => m.id === seed.memberId)!;
  const iso = isoDaysAgo(seed.daysAgo, 11);
  return {
    id: seed.id,
    gymId: GYM_ID,
    memberId: seed.memberId,
    amount: seed.amountPaise,
    paymentMode: seed.mode,
    receiptNumber: `R-2026-${String(1040 + i)}`,
    reference: null,
    paymentDate: iso,
    paidAt: iso,
    status: seed.status ?? "SUCCESS",
    member: { id: member.id, name: member.name, memberCode: member.code },
  };
});

type ExpenseSeed = {
  id: number;
  title: string;
  category: string;
  amountPaise: number;
  daysAgo: number;
  mode?: string;
  notes?: string;
};

const EXPENSE_SEEDS: ExpenseSeed[] = [
  { id: 1, title: "Gym floor rent", category: "Rent", amountPaise: 4500000, daysAgo: 9, mode: "BANK_TRANSFER", notes: "Monthly rent" },
  { id: 2, title: "Electricity bill", category: "Electricity", amountPaise: 320000, daysAgo: 6, mode: "UPI" },
  { id: 3, title: "Treadmill service", category: "Maintenance", amountPaise: 850000, daysAgo: 15, mode: "CASH", notes: "Quarterly service" },
  { id: 4, title: "Trainer salary - Oct", category: "Staff Salary", amountPaise: 3000000, daysAgo: 4, mode: "BANK_TRANSFER" },
  { id: 5, title: "Cleaning supplies", category: "Cleaning", amountPaise: 120000, daysAgo: 2, mode: "CASH" },
  { id: 6, title: "Instagram ads", category: "Marketing", amountPaise: 500000, daysAgo: 7, mode: "CARD" },
  { id: 7, title: "Dumbbell set", category: "Equipment", amountPaise: 1800000, daysAgo: 35, mode: "CARD" },
  { id: 8, title: "Internet bill", category: "Internet", amountPaise: 99900, daysAgo: 1, mode: "UPI" },
  { id: 9, title: "Water bill", category: "Water", amountPaise: 60000, daysAgo: 0, mode: "UPI" },
];

export const MOCK_EXPENSES: ExpenseDto[] = EXPENSE_SEEDS.map((seed) => {
  const iso = isoDaysAgo(seed.daysAgo, 14);
  return {
    id: seed.id,
    gymId: GYM_ID,
    title: seed.title,
    name: seed.title,
    category: seed.category,
    description: seed.notes ?? null,
    notes: seed.notes ?? null,
    amountPaise: seed.amountPaise,
    paymentMode: seed.mode ?? null,
    expenseDate: iso,
    createdAt: iso,
  };
});

/** Today's key helper for previews/tests. */
export function mockTodayKey(): string {
  return dateKeyDaysAgo(0);
}
