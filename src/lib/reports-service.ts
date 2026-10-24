import { listExpenses } from "./api";
import {
  listMembers,
  listMemberships,
  listPayments,
} from "./members-api";
import type { ExpenseDto } from "./api";
import type {
  MemberDto,
  MembershipWithRelationsDto,
  PaymentDto,
} from "./members-api";

export type ReportsBundle = {
  payments: PaymentDto[];
  expenses: ExpenseDto[];
  memberships: MembershipWithRelationsDto[];
  members: MemberDto[];
};

/**
 * Loads everything the Reports page aggregates.
 *
 * The backend has no single report endpoint for these views, so the page
 * combines the same live collections the rest of the app uses:
 * `GET /payments`, `/expenses`, `/memberships` and `/members`.
 *
 * All four reads run in parallel and share one `AbortSignal`, so navigating
 * away cancels every in-flight request instead of updating unmounted state.
 */
export async function fetchReportsData(options?: {
  signal?: AbortSignal;
}): Promise<ReportsBundle> {
  const [payments, expenses, memberships, members] = await Promise.all([
    listPayments(options?.signal),
    listExpenses(undefined, options?.signal),
    listMemberships(undefined, options?.signal),
    listMembers(undefined, options?.signal),
  ]);
  return { payments, expenses, memberships, members };
}
