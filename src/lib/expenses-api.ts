import { apiRequest } from "./api";

/**
 * Expenses API contract (see backend `routes/expenses.route.js`).
 *
 * `GET /expenses` returns the stored rows. The write endpoints validate
 * `{ title, category, amountPaise, expenseDate, notes }` (backend
 * `expenseInput`), while rows may expose the title/notes as `name` /
 * `description`. Reads therefore accept both shapes and normalize them.
 */
export type ExpenseDto = {
  id: number;
  gymId: string;
  /** Present on rows returned by `GET /expenses`. */
  name?: string | null;
  /** Present on the documented write payload. */
  title?: string | null;
  category: string;
  /** Present on rows returned by `GET /expenses`. */
  description?: string | null;
  /** Present on the documented write payload. */
  notes?: string | null;
  /** Amount in paise (integer minor units). */
  amountPaise: number;
  paymentMode?: string | null;
  expenseDate: string;
  createdAt: string;
};

/** Write payload — mirrors the backend `expenseInput` schema exactly. */
export type ExpenseInput = {
  title: string;
  category: string;
  /** Amount in paise (integer minor units). */
  amountPaise: number;
  expenseDate: string;
  notes?: string;
};

export function listExpenses(
  params?: { from?: string; to?: string },
  signal?: AbortSignal,
): Promise<ExpenseDto[]> {
  return apiRequest<ExpenseDto[]>("/expenses", {
    query: params ? { from: params.from, to: params.to } : undefined,
    signal,
  });
}

export function createExpense(input: ExpenseInput): Promise<ExpenseDto> {
  return apiRequest<ExpenseDto>("/expenses", { method: "POST", body: input });
}

export function updateExpense(
  id: number,
  input: Partial<ExpenseInput>,
): Promise<ExpenseDto> {
  return apiRequest<ExpenseDto>(`/expenses/${id}`, {
    method: "PATCH",
    body: input,
  });
}

/** Role-restricted server-side (OWNER / ADMIN / ACCOUNTANT). */
export function deleteExpense(id: number): Promise<unknown> {
  return apiRequest(`/expenses/${id}`, { method: "DELETE" });
}
