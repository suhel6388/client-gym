/**
 * Single API layer for the Gym CRM client.
 *
 * Every HTTP request in the app is defined here and executed through Axios.
 * Feature modules (view models, demo data, form actions) import the request
 * functions from this file instead of creating their own clients.
 *
 * Conventions taken from `backend/API.md`:
 * - Base URL: `NEXT_PUBLIC_API_URL`, defaulting to the deployed Render API.
 *   Every request — in development and production — goes directly to that
 *   absolute URL. Localhost values are ignored so the app never calls a local
 *   API.
 * - Auth is a Better Auth HttpOnly session cookie, so every request uses
 *   `withCredentials: true`. No token is ever stored in JavaScript.
 * - Successful responses wrap their payload in `{ data: ... }`; `apiRequest`
 *   unwraps that envelope automatically.
 * - Errors are normalized into `ApiError` (status, code, details, payload).
 * - Transient timeouts (for example a sleeping Render instance) are retried
 *   once for GET requests and idempotent auth calls. Mutations are never
 *   retried automatically, so a retry cannot duplicate a member/payment.
 */

import axios, {
  AxiosError,
  AxiosRequestConfig,
  isAxiosError,
} from "axios";

const DEFAULT_API_BASE_URL = "https://gym-managment-system-7yiu.onrender.com";

/**
 * The base URL used by every API request.
 *
 * `NEXT_PUBLIC_API_URL` (defaulting to the deployed Render API) is used in
 * every environment, so development and production hit the same backend.
 * An explicit localhost value is rejected so the app never calls a local API.
 */
const envBase = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
const isLocalBase =
  /(?:^https?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:\/|$)/i.test(
    envBase,
  );
const configuredBase = (
  envBase && !isLocalBase ? envBase : DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

/** Always ends with `/api/v1`, exactly like the backend routes. */
export const API_BASE = /\/api\/v1$/i.test(configuredBase)
  ? configuredBase
  : `${configuredBase}/api/v1`;

/** Route that renders the authenticated gym dashboard. */
export const DASHBOARD_PATH = "/dashboard";

/** Route that renders the platform-owner (SaaS super-admin) console. */
export const SUPER_ADMIN_PATH = "/super-admin";

export type ApiErrorBody = {
  error?: string;
  message?: string;
  code?: string;
  reason?: string;
  details?: unknown;
  requiresEmailVerification?: boolean;
  email?: string;
  [key: string]: unknown;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  /** The full response body, useful for endpoint-specific handling. */
  payload?: unknown;

  constructor(
    message: string,
    status: number,
    options: { code?: string; details?: unknown; payload?: unknown } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options.code;
    this.details = options.details;
    this.payload = options.payload;
  }
}

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /** Query string parameters; `undefined` and `null` values are skipped. */
  query?: QueryParams;
  headers?: Record<string, string>;
  /**
   * Extra attempts for transient timeouts/network errors.
   * Defaults to 1 for GET and 0 for everything else.
   */
  retry?: number;
  /**
   * Per-request timeout in milliseconds. Defaults to the client-wide 30s.
   * Long-running auth calls (for example a cold-starting Render instance)
   * can raise this without affecting every other request.
   */
  timeout?: number;
};

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

const buildRequestConfig = (
  method: NonNullable<RequestOptions["method"]>,
  {
    body,
    signal,
    query,
    headers,
    timeout,
  }: Omit<RequestOptions, "method"> = {},
): AxiosRequestConfig => ({
  method,
  data: body,
  signal,
  params: query,
  timeout,
  paramsSerializer: {
    // Skip undefined/empty values cleanly.
    indexes: null,
  },
  headers,
});

const getErrorMessage = (
  status: number,
  body: ApiErrorBody | null,
): string => {
  // Prefer the server's own message — it is always more specific than a
  // generic per-status fallback.
  if (body?.error) return body.error;
  if (body?.message) return body.message;
  if (status === 400) return "Validation failed. Check the submitted values.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 402) {
    return "Your subscription has expired. Please renew to continue.";
  }
  if (status === 403) return "You don't have access to this gym's data.";
  if (status === 404) return "The requested record was not found.";
  if (status === 409) return "This record already exists.";
  if (status === 429) return "Too many attempts. Please wait and try again.";
  if (status === 0) {
    return "Can't reach the server. Make sure the API is running.";
  }
  return `Request failed with status ${status}.`;
};

const normalizeError = (error: unknown): ApiError => {
  if (isAxiosError(error)) {
    const axiosErr = error as AxiosError<unknown>;

    if (axiosErr.code === "ECONNABORTED") {
      return new ApiError(
        "The server took too long to respond. It may be waking up — please try again.",
        0,
        { code: "TIMEOUT" },
      );
    }
    if (axiosErr.name === "CanceledError" || axiosErr.code === "ERR_CANCELED") {
      return new ApiError("Request was cancelled.", 0);
    }

    const status = axiosErr.response?.status ?? 0;
    const data = axiosErr.response?.data;
    const body =
      data && typeof data === "object" ? (data as ApiErrorBody) : null;
    const message =
      typeof data === "string" && data.trim()
        ? data
        : getErrorMessage(status, body);

    return new ApiError(message, status, {
      code: body?.code,
      details: body?.details,
      payload: data,
    });
  }

  if (error instanceof ApiError) return error;
  return new ApiError("An unexpected error occurred.", 0);
};

/** Time to wait between transient-error attempts. */
const RETRY_DELAY_MS = 1500;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Network failures, timeouts, and gateway errors are safe to retry when the
 * request is idempotent. A sleeping Render instance typically accepts the
 * retried request after the first attempt has woken it up.
 */
const isTransientError = (error: unknown): boolean => {
  if (!isAxiosError(error)) return false;
  if (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK") {
    return true;
  }
  const status = error.response?.status;
  return status === 408 || status === 502 || status === 503 || status === 504;
};

/**
 * Performs a JSON request, unwraps the standard `{ data }` envelope and throws
 * a typed `ApiError` for non-2xx responses.
 *
 * GET requests retry once by default; pass `retry: 0` to disable it or
 * `retry: 1` on an idempotent POST. Mutations keep the default of no retry.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    retry = method === "GET" ? 1 : 0,
    ...rest
  } = options;
  const attempts = Math.max(0, retry) + 1;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await apiClient.request<unknown>({
        url: path,
        ...buildRequestConfig(method, rest),
      });

      if (response.status === 204) return undefined as T;

      const payload = response.data;
      if (
        payload &&
        typeof payload === "object" &&
        Object.prototype.hasOwnProperty.call(payload, "data")
      ) {
        return (payload as { data: T }).data;
      }

      return payload as T;
    } catch (error) {
      if (attempt < attempts && isTransientError(error)) {
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      throw normalizeError(error);
    }
  }

  // The loop always returns or throws; this keeps TypeScript satisfied.
  throw new ApiError("Request failed. Please try again.", 0);
}

// Keep the old name for backward compatibility with existing imports.
export const apiFetch = apiRequest;

/**
 * Wakes a sleeping API instance (Render free services spin down after a
 * period of inactivity). The promise is shared so a page can start the warm-up
 * on mount and the signup POST can await the same request instead of starting
 * a second one.
 *
 * Failures are swallowed: the actual request will surface a useful error.
 */
let warmUpPromise: Promise<void> | null = null;

export function warmUpApi(): Promise<void> {
  if (!warmUpPromise) {
    warmUpPromise = apiRequest<{ status?: string }>("/health", {
      // A cold Render instance can take well over the default 30s to boot.
      // No retry: signup must not wait two full timeouts before it even starts.
      timeout: 45000,
      retry: 0,
    })
      .then(() => undefined)
      .catch(() => {
        // Let the next caller try again if the instance was still down.
        warmUpPromise = null;
      });
  }
  return warmUpPromise;
}

// ---------------------------------------------------------------------------
// Auth — `/api/v1/auth/*` (see API.md → Authentication)
// ---------------------------------------------------------------------------

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  gymId?: string | null;
  role?: string | null;
  emailVerified?: boolean;
  image?: string | null;
};

export type CurrentSession = {
  user: AuthUser;
  session: { id?: string; expiresAt?: string } | null;
};

export type SignupInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type SetupGymInput = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
};

export type SignupResult = {
  message?: string;
  user?: AuthUser | null;
  code?: string;
  email?: string;
  /**
   * True when the email existed but was never verified. The backend re-sent
   * the OTP and the client must continue on the verify-email screen.
   */
  requiresEmailVerification?: boolean;
  /** False when the account was created but the OTP email could not be sent. */
  emailSent?: boolean;
};

export type VerifyEmailResult = {
  status?: boolean;
  token?: string;
  user?: AuthUser | null;
  message?: string;
};

export type LoginResult = {
  token?: string;
  user?: AuthUser | null;
  redirect?: boolean;
};

export type GoogleSignInResult = {
  url: string;
  redirect?: boolean;
};

/** POST /auth/signup — create the account and send the 6-digit OTP. */
export async function signup(input: SignupInput) {
  // Wake a sleeping Render instance before the mutation. Otherwise the first
  // request can exceed the client timeout even though the server goes on to
  // create the account, leaving the user with a confusing timeout error.
  await warmUpApi();
  return apiRequest<SignupResult>("/auth/signup", {
    method: "POST",
    body: input,
    // Creating an account includes password hashing, a DB write and the OTP
    // email. 60s leaves room for a cold instance without hanging forever.
    timeout: 60000,
  });
}

/** POST /auth/verify-email — verify the OTP; the backend sets the session. */
export function verifyEmailOtp(input: { email: string; otp: string }) {
  return apiRequest<VerifyEmailResult>("/auth/verify-email", {
    method: "POST",
    body: input,
  });
}

/** POST /auth/resend-otp — send a fresh code (invalidates the previous one). */
export function resendOtp(email: string) {
  return apiRequest<{ message: string }>("/auth/resend-otp", {
    method: "POST",
    body: { email },
  });
}

/** POST /auth/login — sign in with email + password. */
export function login(input: LoginInput) {
  return apiRequest<LoginResult>("/auth/login", {
    method: "POST",
    body: input,
    // Signing in again is safe: the first attempt may have succeeded even if
    // the response was lost to a Render cold-start timeout.
    retry: 1,
  });
}

/** POST /auth/logout — clear the session cookie. */
export function logout() {
  return apiRequest<unknown>("/auth/logout", {
    method: "POST",
    // Idempotent: retry so a timed-out logout still clears the cookie.
    retry: 1,
  });
}

/** GET /auth/me — current user + gym context. Throws `ApiError(401)` when signed out. */
export function fetchCurrentUser() {
  return apiRequest<CurrentSession>("/auth/me");
}

/**
 * POST /auth/google — the backend returns the Google consent URL and the
 * browser redirects there. Google verifies the email, so OTP is skipped.
 *
 * `errorCallbackURL` keeps OAuth failures on the frontend callback page
 * instead of Better Auth's error page on the API host.
 */
export function getGoogleSignInUrl(
  callbackURL: string,
  errorCallbackURL?: string,
) {
  return apiRequest<GoogleSignInResult>("/auth/google", {
    method: "POST",
    body: { callbackURL, errorCallbackURL },
    // A retry creates a fresh OAuth state, so it is safe after a timeout.
    retry: 1,
  });
}

/** POST /auth/setup-gym — create the owner's gym and start the free trial. */
export function setupGym(input: SetupGymInput) {
  return apiRequest<{ id: string; name: string; phone?: string | null }>(
    "/auth/setup-gym",
    { method: "POST", body: input },
  );
}

/** POST /auth/forgot-password — email a reset link (always a neutral answer). */
export function forgotPassword(email: string) {
  return apiRequest<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

/** POST /auth/reset-password — complete the reset with the emailed token. */
export function resetPassword(token: string, newPassword: string) {
  return apiRequest<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: { token, newPassword },
  });
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/**
 * Sanitize a post-login redirect target. Only same-app paths are allowed —
 * external URLs, protocol-relative URLs and auth/onboarding routes are rejected
 * so they cannot cause a redirect loop.
 */
export function safeNext(
  raw: string | null | undefined,
  fallback = DASHBOARD_PATH,
): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\s"\\<>\u0000-\u001f]/.test(value)) return fallback;

  const authPages = [
    "/login",
    "/signup",
    "/verify-email",
    "/auth/callback",
    "/forgot-password",
    "/reset-password",
    "/setup-gym",
  ];
  if (
    authPages.some(
      (page) =>
        value === page ||
        value.startsWith(`${page}?`) ||
        value.startsWith(`${page}/`),
    )
  ) {
    return fallback;
  }
  return value;
}

/** Build the login URL, preserving where the user was heading. */
export function loginUrlWithNext(next: string): string {
  const target = safeNext(next);
  return target && target !== DASHBOARD_PATH
    ? `/login?next=${encodeURIComponent(target)}`
    : "/login";
}

/** Mask an email for display: "john@example.com" -> "j•••@example.com". */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 1)}•••@${domain}`;
}

/**
 * Where a signed-in user belongs. Used after email login, OTP verification,
 * Google callback and gym setup so every entry point follows the same rules:
 * - session missing           -> login
 * - email not verified        -> verify-email
 * - no gym yet                -> setup-gym
 * - otherwise                 -> the requested dashboard page
 */
export function postAuthDestination(
  user: AuthUser | null | undefined,
  requested?: string | null,
): string {
  if (!user) return loginUrlWithNext(requested ?? DASHBOARD_PATH);
  if (user.emailVerified === false) {
    return `/verify-email?email=${encodeURIComponent(user.email)}&reason=dashboard`;
  }
  // Platform owners are not gym users. They always land in the super-admin
  // console and can never be routed into gym onboarding or a gym dashboard.
  if (user.role === "SUPER_ADMIN") {
    return requested && requested.startsWith(SUPER_ADMIN_PATH)
      ? safeNext(requested, SUPER_ADMIN_PATH)
      : SUPER_ADMIN_PATH;
  }
  if (!user.gymId) return "/setup-gym";
  return safeNext(requested);
}

// ---------------------------------------------------------------------------
// Pending signup — gym details collected before the account exists
// ---------------------------------------------------------------------------
//
// The backend creates the user at signup and the gym (plus its trial) via
// POST /auth/setup-gym after the email is verified. These details live in
// sessionStorage for the few seconds between those steps.

const PENDING_SIGNUP_KEY = "darkgold:pending-signup";

export type PendingSignup = {
  email: string;
  gymName: string;
  gymPhone?: string;
  gymAddress?: string;
};

export function savePendingSignup(pending: PendingSignup): void {
  try {
    window.sessionStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(pending));
  } catch {
    // Storage unavailable (private mode) — setup-gym page is the fallback.
  }
}

export function readPendingSignup(email?: string): PendingSignup | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_SIGNUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSignup;
    if (!parsed?.email || !parsed?.gymName) return null;
    // Only reuse it for the account that is actually being verified.
    if (email && parsed.email !== email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingSignup(): void {
  try {
    window.sessionStorage.removeItem(PENDING_SIGNUP_KEY);
  } catch {
    // Ignore — nothing sensitive beyond the gym name.
  }
}

// ---------------------------------------------------------------------------
// Members, plans, memberships and payments — API.md
// ---------------------------------------------------------------------------

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

/** Trimmed member shape embedded on a membership row. */
export type MembershipMemberDto = {
  id: string;
  memberCode: string;
  name: string;
  phone: string;
  email: string | null;
  archivedAt: string | null;
};

/** `GET /memberships` adds the related member and `effectiveStatus`. */
export type MembershipWithRelationsDto = MembershipDto & {
  member: MembershipMemberDto;
  effectiveStatus: MembershipStatusDto;
};

export type PaymentDto = {
  id: string;
  gymId: string;
  memberId: string;
  /** Amount in paise (minor units). */
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

/** GET /members — optional `from`, `to`, `search`, `includeArchived`. */
export function listMembers(
  params?: QueryParams,
  signal?: AbortSignal,
): Promise<MemberDto[]> {
  return apiRequest<MemberDto[]>("/members", { query: params, signal });
}

/** POST /members */
export function createMember(
  input: MemberInput,
  signal?: AbortSignal,
): Promise<MemberDto> {
  return apiRequest<MemberDto>("/members", {
    method: "POST",
    body: input,
    signal,
  });
}

/** PATCH /members/:id */
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

/** DELETE /members/:id — soft delete (archive). */
export function archiveMember(
  id: string,
  signal?: AbortSignal,
): Promise<unknown> {
  return apiRequest(`/members/${id}`, { method: "DELETE", signal });
}

/** GET /plans */
export function listPlans(signal?: AbortSignal): Promise<PlanDto[]> {
  return apiRequest<PlanDto[]>("/plans", { signal });
}

/** POST /plans */
export function createPlan(
  input: CreatePlanInput,
  signal?: AbortSignal,
): Promise<PlanDto> {
  return apiRequest<PlanDto>("/plans", {
    method: "POST",
    body: input,
    signal,
  });
}

/** PATCH /plans/:id */
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

/** DELETE /plans/:id — deactivate the plan. */
export function deactivatePlan(
  id: string,
  signal?: AbortSignal,
): Promise<unknown> {
  return apiRequest(`/plans/${id}`, { method: "DELETE", signal });
}

/** GET /memberships — optional `status` filter. */
export function listMemberships(
  params?: { status?: MembershipStatusDto },
  signal?: AbortSignal,
): Promise<MembershipWithRelationsDto[]> {
  return apiRequest<MembershipWithRelationsDto[]>("/memberships", {
    query: params?.status ? { status: params.status } : undefined,
    signal,
  });
}

/** POST /memberships */
export function createMembership(
  input: MembershipInput,
): Promise<MembershipDto> {
  return apiRequest<MembershipDto>("/memberships", {
    method: "POST",
    body: input,
  });
}

/** POST /memberships/:id/freeze */
export function freezeMembership(id: string): Promise<unknown> {
  return apiRequest(`/memberships/${id}/freeze`, { method: "POST" });
}

/** POST /memberships/:id/cancel */
export function cancelMembership(id: string): Promise<unknown> {
  return apiRequest(`/memberships/${id}/cancel`, { method: "POST" });
}

/** GET /payments — kept for the existing payments screen. */
export function listPayments(signal?: AbortSignal): Promise<PaymentDto[]> {
  return apiRequest<PaymentDto[]>("/payments", { signal });
}

/** POST /payments */
export function createPayment(input: PaymentInput): Promise<unknown> {
  return apiRequest("/payments", { method: "POST", body: input });
}

// ---------------------------------------------------------------------------
// Attendance — note the backend path spelling: `/attendence`
// ---------------------------------------------------------------------------

export type AttendanceMarkingMethod = "MANUAL" | "QR_CODE" | "BIOMETRIC";

export type AttendanceRecord = {
  id: string;
  memberId: string;
  attendanceDate: string;
  checkInAt: string;
  checkOutAt: string | null;
  markingMethod: AttendanceMarkingMethod;
  checkInNotes?: string | null;
  checkOutNotes?: string | null;
};

export type AttendanceMember = {
  id: string;
  memberCode: string;
  name: string;
  phone: string;
};

export type AttendanceSummary = {
  totalCheckIns: number;
  currentlyCheckedIn: number;
  completedSessions: number;
};

export type AttendanceHistory = {
  data: AttendanceRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/** GET /attendence/members/search?q=... */
export function searchAttendanceMembers(
  q: string,
  signal?: AbortSignal,
): Promise<AttendanceMember[]> {
  return apiRequest<AttendanceMember[]>("/attendence/members/search", {
    query: { q },
    signal,
  });
}

/** POST /attendence/check-in */
export function checkInMember(input: {
  memberId: string;
  /** `YYYY-MM-DD` */
  attendanceDate: string;
  notes?: string;
  markingMethod?: AttendanceMarkingMethod;
}) {
  return apiRequest<AttendanceRecord>("/attendence/check-in", {
    method: "POST",
    body: input,
  });
}

/** POST /attendence/check-out */
export function checkOutMember(input: { memberId: string; notes?: string }) {
  return apiRequest<AttendanceRecord>("/attendence/check-out", {
    method: "POST",
    body: input,
  });
}

/** GET /attendence/open/:memberId */
export function getOpenAttendance(
  memberId: string,
  signal?: AbortSignal,
): Promise<AttendanceRecord | null> {
  return apiRequest<AttendanceRecord | null>(
    `/attendence/open/${memberId}`,
    { signal },
  );
}

/** GET /attendence/members/:memberId/history */
export function getAttendanceHistory(
  memberId: string,
  params?: { page?: number; limit?: number },
  signal?: AbortSignal,
): Promise<AttendanceHistory> {
  return apiRequest<AttendanceHistory>(
    `/attendence/members/${memberId}/history`,
    { query: params, signal },
  );
}

/** GET /attendence/summary/today */
export function getAttendanceSummaryToday(
  signal?: AbortSignal,
): Promise<AttendanceSummary> {
  return apiRequest<AttendanceSummary>("/attendence/summary/today", {
    signal,
  });
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export type ExpenseDto = {
  id: number;
  gymId: string;
  /** Present on rows returned by GET /expenses. */
  name?: string | null;
  /** Present on the documented write payload. */
  title?: string | null;
  category: string;
  /** Present on rows returned by GET /expenses. */
  description?: string | null;
  /** Present on the documented write payload. */
  notes?: string | null;
  /** Amount in paise (integer minor units). */
  amountPaise: number;
  paymentMode?: string | null;
  expenseDate: string;
  createdAt: string;
};

/** Write payload — mirrors the backend `expenseInput` schema. */
export type ExpenseInput = {
  title: string;
  category: string;
  /** Amount in paise (integer minor units). */
  amountPaise: number;
  expenseDate: string;
  notes?: string;
};

/** GET /expenses — optional `from` / `to` (`YYYY-MM-DD`). */
export function listExpenses(
  params?: { from?: string; to?: string },
  signal?: AbortSignal,
): Promise<ExpenseDto[]> {
  return apiRequest<ExpenseDto[]>("/expenses", {
    query: params ? { from: params.from, to: params.to } : undefined,
    signal,
  });
}

/** POST /expenses */
export function createExpense(input: ExpenseInput): Promise<ExpenseDto> {
  return apiRequest<ExpenseDto>("/expenses", {
    method: "POST",
    body: input,
  });
}

/** PATCH /expenses/:id */
export function updateExpense(
  id: number,
  input: Partial<ExpenseInput>,
): Promise<ExpenseDto> {
  return apiRequest<ExpenseDto>(`/expenses/${id}`, {
    method: "PATCH",
    body: input,
  });
}

/** DELETE /expenses/:id — role-restricted server-side. */
export function deleteExpense(id: number): Promise<unknown> {
  return apiRequest(`/expenses/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Staff (receptionists)
// ---------------------------------------------------------------------------

export type ReceptionistDto = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  gymId: string;
  createdAt: string;
};

export type CreateReceptionistInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

/** POST /staff/receptionists — ADMIN only. */
export function createReceptionist(input: CreateReceptionistInput) {
  return apiRequest<ReceptionistDto>("/staff/receptionists", {
    method: "POST",
    body: input,
  });
}

/** GET /staff/receptionists — ADMIN only. */
export function listReceptionists(signal?: AbortSignal) {
  return apiRequest<ReceptionistDto[]>("/staff/receptionists", { signal });
}

/** DELETE /staff/receptionists/:id — ADMIN only. */
export function deleteReceptionist(id: string) {
  return apiRequest<{ message: string }>(`/staff/receptionists/${id}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export type DashboardReport = {
  totalMembers: number;
  activeMemberships: number;
  membershipsExpiringIn7Days: number;
  collectedTodayPaise: number;
  expensesTodayPaise: number;
};

/** GET /reports/dashboard */
export function fetchDashboardReport(
  signal?: AbortSignal,
): Promise<DashboardReport> {
  return apiRequest<DashboardReport>("/reports/dashboard", { signal });
}

/** GET /reports/due-memberships */
export function fetchDueMemberships(
  signal?: AbortSignal,
): Promise<MembershipWithRelationsDto[]> {
  return apiRequest<MembershipWithRelationsDto[]>("/reports/due-memberships", {
    signal,
  });
}

// ---------------------------------------------------------------------------
// SaaS subscription & billing
// ---------------------------------------------------------------------------

export type SubscriptionStatus = {
  subscription: {
    id: string;
    status:
      | "TRIALING"
      | "ACTIVE"
      | "EXPIRED"
      | "CANCELLED"
      | "PAST_DUE"
      | "SUSPENDED";
    planNameSnapshot?: string | null;
    pricePaise?: number;
    currency?: string;
    trialStartsAt?: string | null;
    trialEndsAt?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
    cancelledAt?: string | null;
    paymentProvider?: string | null;
    remainingTrialDays?: number;
  } | null;
  entitled: boolean;
  expiresAt: string | null;
  remainingDays: number;
  reason: string;
};

export type SubscriptionPlan = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  pricePaise: number;
  currency: string;
  durationMonths: number;
  isActive: boolean;
  displayOrder?: number;
  features: string[];
  maxStaff?: number | null;
  maxBranches?: number | null;
};

export type SubscriptionCheckout = {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  status: string;
  reused?: boolean;
};

/** GET /subscription/me */
export function fetchSubscription(signal?: AbortSignal) {
  return apiRequest<SubscriptionStatus>("/subscription/me", { signal });
}

/** GET /subscription/plans — public catalog. */
export function listSubscriptionPlans(signal?: AbortSignal) {
  return apiRequest<SubscriptionPlan[]>("/subscription/plans", { signal });
}

/** POST /subscription/trial — start the one-time free trial. */
export function startSubscriptionTrial() {
  return apiRequest<{
    subscriptionId: string;
    status: string;
    trialStartsAt: string;
    trialEndsAt: string;
    alreadyStarted: boolean;
  }>("/subscription/trial", { method: "POST", body: {} });
}

/** POST /subscription/checkout — create a Razorpay order. */
export function createSubscriptionCheckout(planId: string) {
  return apiRequest<SubscriptionCheckout>("/subscription/checkout", {
    method: "POST",
    body: { planId },
  });
}

/** POST /subscription/verify — verify the Razorpay signature server-side. */
export function verifySubscriptionPayment(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  return apiRequest<{
    subscription: SubscriptionStatus["subscription"];
    payment: { id: string; status: string; verifiedAt?: string };
    alreadyVerified: boolean;
  }>("/subscription/verify", { method: "POST", body: input });
}

/** GET /subscription/history */
export function fetchSubscriptionHistory(signal?: AbortSignal) {
  return apiRequest<{
    subscription: SubscriptionStatus["subscription"];
    payments: Array<{
      id: string;
      planId: string | null;
      amountPaise: number;
      currency: string;
      status: string;
      provider: string;
      orderId: string | null;
      paymentId: string | null;
      failureReason?: string | null;
      verifiedAt?: string | null;
      createdAt: string;
    }>;
  }>("/subscription/history", { signal });
}

/** POST /subscription/cancel */
export function cancelSubscription() {
  return apiRequest<{
    subscriptionId: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
    cancelledAt: string | null;
    alreadyCancelled: boolean;
  }>("/subscription/cancel", { method: "POST", body: {} });
}

// ---------------------------------------------------------------------------
// Platform administration — `/api/v1/super-admin/*`
// ---------------------------------------------------------------------------
//
// These endpoints are only reachable by a database-backed SUPER_ADMIN session.
// The client treats them as read/write platform operations; the backend is the
// authorization boundary and re-checks the role for every call.

export type PlatformSubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "PAST_DUE"
  | "SUSPENDED"
  | "NO_SUBSCRIPTION";

export type PlatformOwner = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
};

export type PlatformSubscription = {
  id: string;
  status: Exclude<PlatformSubscriptionStatus, "NO_SUBSCRIPTION">;
  effectiveStatus: PlatformSubscriptionStatus;
  entitled: boolean;
  entitlementReason: string;
  plan: SubscriptionPlan | null;
  planId: string | null;
  planNameSnapshot?: string | null;
  pricePaise: number;
  currency: string;
  trialStartsAt: string | null;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  expiresAt: string | null;
  remainingDays: number;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  paymentProvider?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlatformGym = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  registeredAt: string;
  createdAt: string;
  owner: PlatformOwner | null;
  owners: PlatformOwner[];
  effectiveStatus: PlatformSubscriptionStatus;
  subscription: PlatformSubscription | null;
  expiryDate: string | null;
  memberCount: number;
  staffCount: number;
};

export type PlatformAuditLog = {
  id: string;
  action: string;
  gymId: string | null;
  planId: string | null;
  subscriptionId: string | null;
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  reason: string | null;
  details: unknown;
  createdAt: string;
};

export type PlatformStats = {
  totalGyms: number;
  activeSubscriptions: number;
  trialGyms: number;
  expiredSubscriptions: number;
  suspendedGyms: number;
  pastDueGyms: number;
  noSubscriptionGyms: number;
  subscriptionRevenuePaise: number;
  monthlyRevenuePaise: number;
  successfulPayments: number;
  monthlySuccessfulPayments: number;
  planDistribution: Array<{
    planId: string | null;
    planName: string;
    count: number;
  }>;
  expiringSoon: Array<{
    gymId: string;
    gymName: string;
    status: string;
    effectiveStatus: PlatformSubscriptionStatus;
    planName: string;
    expiresAt: string | null;
    remainingDays: number;
  }>;
  recentGyms: PlatformGym[];
  recentActivity: PlatformAuditLog[];
  generatedAt: string;
};

export type PlatformPayment = {
  id: string;
  planId: string | null;
  subscriptionId: string | null;
  amountPaise: number;
  currency: string;
  status: string;
  provider: string;
  orderId: string | null;
  paymentId: string | null;
  failureReason?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
};

export type PlatformTrial = {
  id: string;
  type: "INITIAL" | "EXTENSION";
  startsAt: string;
  endsAt: string;
  reason?: string | null;
  grantedById?: string | null;
  grantedByRole?: string | null;
  source?: string | null;
  createdAt: string;
};

export type PlatformGymDetail = {
  gym: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    registeredAt: string;
    createdAt: string;
  };
  owner: PlatformOwner | null;
  owners: PlatformOwner[];
  staff: PlatformOwner[];
  effectiveStatus: PlatformSubscriptionStatus;
  subscription: PlatformSubscription | null;
  expiryDate: string | null;
  payments: PlatformPayment[];
  trialHistory: PlatformTrial[];
  subscriptionHistory: PlatformAuditLog[];
  auditLogs: PlatformAuditLog[];
  stats: {
    members: number;
    owners: number;
    staff: number;
    totalUsers: number;
    attendanceRecords: number;
    membershipPlans: number;
    activeMemberships: number;
  };
};

export type PlatformGymList = {
  gyms: PlatformGym[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    q: string | null;
    status: PlatformSubscriptionStatus | null;
    planId: string | null;
    sort: PlatformGymSort;
  };
};

export type PlatformGymSort = "newest" | "oldest" | "name";

export type PlatformGymFilters = {
  q?: string;
  status?: PlatformSubscriptionStatus | "";
  planId?: string;
  page?: number;
  limit?: number;
  sort?: PlatformGymSort;
};

export type PlatformMutationResult = {
  message?: string;
  [key: string]: unknown;
};

/** GET /super-admin/stats — real database totals. */
export function fetchPlatformStats(signal?: AbortSignal) {
  return apiRequest<PlatformStats>("/super-admin/stats", { signal });
}

/** GET /super-admin/gyms — cross-gym directory with search and filters. */
export function listPlatformGyms(
  filters: PlatformGymFilters = {},
  signal?: AbortSignal,
) {
  return apiRequest<PlatformGymList>("/super-admin/gyms", {
    signal,
    query: {
      q: filters.q?.trim() || undefined,
      status: filters.status || undefined,
      planId: filters.planId || undefined,
      page: filters.page,
      limit: filters.limit,
      sort: filters.sort,
    },
  });
}

/** GET /super-admin/gyms/:gymId — owner, billing history and audit trail. */
export function fetchPlatformGym(gymId: string, signal?: AbortSignal) {
  return apiRequest<PlatformGymDetail>(
    `/super-admin/gyms/${encodeURIComponent(gymId)}`,
    { signal },
  );
}

/** GET /super-admin/plans — every plan, including inactive ones. */
export function listPlatformPlans(signal?: AbortSignal) {
  return apiRequest<SubscriptionPlan[]>("/super-admin/plans", { signal });
}

/** GET /super-admin/activity — recent platform audit entries. */
export function fetchPlatformActivity(limit = 50, signal?: AbortSignal) {
  return apiRequest<PlatformAuditLog[]>("/super-admin/activity", {
    signal,
    query: { limit },
  });
}

/** POST /super-admin/gyms/:gymId/plan — assign or change the paid plan. */
export function assignPlatformPlan(
  gymId: string,
  input: { planId: string; expiresAt?: string; reason: string },
) {
  return apiRequest<{ subscription: PlatformSubscription }>(
    `/super-admin/gyms/${encodeURIComponent(gymId)}/plan`,
    { method: "POST", body: input },
  );
}

/** POST /super-admin/gyms/:gymId/extend-expiry — extend a paid period/trial. */
export function extendPlatformExpiry(
  gymId: string,
  input: { additionalDays?: number; expiresAt?: string; reason: string },
) {
  return apiRequest<{
    subscriptionId: string;
    status: string;
    expiresAt: string | null;
    previousExpiry: string | null;
    extendedByDays: number | null;
  }>(`/super-admin/gyms/${encodeURIComponent(gymId)}/extend-expiry`, {
    method: "POST",
    body: input,
  });
}

/** POST /super-admin/gyms/:gymId/trial — start or extend a trial. */
export function startPlatformTrial(
  gymId: string,
  input: { days?: number; startsAt?: string; reason: string },
) {
  return apiRequest<{
    subscriptionId: string;
    status: string;
    trialStartsAt: string;
    trialEndsAt: string;
    extended: boolean;
  }>(`/super-admin/gyms/${encodeURIComponent(gymId)}/trial`, {
    method: "POST",
    body: input,
  });
}

/** POST /super-admin/gyms/:gymId/trial/end — end a trial immediately. */
export function endPlatformTrial(gymId: string, reason: string) {
  return apiRequest<{
    subscriptionId: string;
    status: string;
    trialEndsAt: string;
  }>(`/super-admin/gyms/${encodeURIComponent(gymId)}/trial/end`, {
    method: "POST",
    body: { reason },
  });
}

/** PATCH /super-admin/gyms/:gymId/access — suspend or reactivate a gym. */
export function setPlatformAccess(
  gymId: string,
  input: { status: "ACTIVE" | "SUSPENDED"; expiresAt?: string; reason: string },
) {
  return apiRequest<{ subscription: PlatformSubscription }>(
    `/super-admin/gyms/${encodeURIComponent(gymId)}/access`,
    { method: "PATCH", body: input },
  );
}
