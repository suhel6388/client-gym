import { fetchMemberJoins, listExpenses } from "./api";
import { listMemberships, listPayments } from "./members-api";
import type { ExpenseDto, MemberJoinDto } from "./api";
import type {
  MembershipWithRelationsDto,
  PaymentDto,
} from "./members-api";

export type ReportsBundle = {
  payments: PaymentDto[];
  expenses: ExpenseDto[];
  memberships: MembershipWithRelationsDto[];
  members: MemberJoinDto[];
};

/**
 * Loads everything the Reports page aggregates.
 *
 * The backend has no single report endpoint for these views, so the page
 * combines live collections: `GET /payments`, `/expenses`, `/memberships` and
 * the lightweight `/reports/member-joins` feed. The last one replaces a full
 * `/members` download (with memberships and plans) that was only used to
 * count join dates.
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
    fetchMemberJoins(options?.signal),
  ]);
  return { payments, expenses, memberships, members };
}
