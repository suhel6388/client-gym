import { listExpenses } from "./expenses-api";
import {
  listMembers,
  listMemberships,
  listPayments,
} from "./members-api";
import {
  MOCK_EXPENSES,
  MOCK_MEMBERS,
  MOCK_MEMBERSHIPS,
  MOCK_PAYMENTS,
} from "./reports-mock";

/**
 * Reports data source switch.
 *
 * - `true`  → Reports page renders local dummy data (current behaviour,
 *   no backend required).
 * - `false` → Reports page calls the axios API layer (`src/lib/api.ts`
 *   + `members-api.ts` / `expenses-api.ts`).
 *
 * The axios path is kept ready: just flip this flag (or set
 * `NEXT_PUBLIC_USE_MOCK_REPORTS=false`) once the backend routes are fixed.
 */
export const REPORTS_USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK_REPORTS !== "false";

const mockDelay = (ms = 350): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export type ReportsBundle = {
  payments: typeof MOCK_PAYMENTS;
  expenses: typeof MOCK_EXPENSES;
  memberships: typeof MOCK_MEMBERSHIPS;
  members: typeof MOCK_MEMBERS;
};

/**
 * Single entry point for the Reports page. Mock-first, axios-ready.
 * Pass `{ mock: false }` to force live API even while the flag is on.
 */
export async function fetchReportsData(options?: {
  mock?: boolean;
  signal?: AbortSignal;
}): Promise<ReportsBundle> {
  const useMock = options?.mock ?? REPORTS_USE_MOCK;
  if (useMock) {
    await mockDelay();
    if (options?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    return {
      payments: MOCK_PAYMENTS,
      expenses: MOCK_EXPENSES,
      memberships: MOCK_MEMBERSHIPS,
      members: MOCK_MEMBERS,
    };
  }

  // ---- Live axios path (ready, not used until backend is fixed) ----
  const [payments, expenses, memberships, members] = await Promise.all([
    listPayments(options?.signal),
    listExpenses(undefined, options?.signal),
    listMemberships(undefined, options?.signal),
    listMembers(options?.signal),
  ]);
  return { payments, expenses, memberships, members };
}
