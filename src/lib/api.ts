/**
 * Clean API client for Gym CRM.
 *
 * - Uses Axios (easy to swap config, add interceptors later)
 * - Reads base URL from `NEXT_PUBLIC_API_URL` (falls back to localhost)
 * - Returns the `{ data }` envelope when present
 * - Normalizes errors into `ApiError`
 */

import axios, {
  AxiosError,
  AxiosRequestConfig,
  isAxiosError,
} from "axios";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:5000/api/v1";

export type ApiErrorBody = {
  error?: string;
  message?: string;
  details?: unknown;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export type QueryParams = Record<
  string,
  string | number | boolean | undefined
>;

export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /** Query string parameters; `undefined` or empty values are skipped. */
  query?: QueryParams;
  headers?: Record<string, string>;
};

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Keep a small type helper for request configs if needed later
const buildRequestConfig = (
  method: NonNullable<RequestOptions["method"]>,
  { body, signal, query, headers }: Omit<RequestOptions, "method"> = {},
): AxiosRequestConfig => {
  const config: AxiosRequestConfig = {
    method,
    data: body,
    signal,
    params: query,
    paramsSerializer: {
      // Skip undefined/empty values cleanly
      indexes: null,
    },
    headers,
  };

  return config;
};

const getErrorMessage = (
  status: number,
  body: ApiErrorBody | null,
): string => {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You don't have access to this gym's data.";
  if (status === 404) return "The requested record was not found.";
  if (body?.error) return body.error;
  if (body?.message) return body.message;
  if (status === 0) return "Can't reach the server. Make sure the API is running.";
  return `Request failed with status ${status}.`;
};

const normalizeError = (error: unknown): ApiError => {
  if (isAxiosError(error)) {
    const axiosErr = error as AxiosError<ApiErrorBody>;

    // Request aborted
    if (axiosErr.code === "ECONNABORTED" || axiosErr.name === "CanceledError") {
      return new ApiError("Request was cancelled.", 0);
    }

    const status = axiosErr.response?.status ?? 0;
    const body = axiosErr.response?.data ?? null;

    return new ApiError(getErrorMessage(status, body), status, body?.details);
  }

  return new ApiError("An unexpected error occurred.", 0);
};

/**
 * Performs a JSON request and unwraps the `{ data }` envelope if present.
 * Throws `ApiError` for non-2xx responses.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", ...rest } = options;

  try {
    const config = buildRequestConfig(method, rest);
    const response = await apiClient.request<T | { data?: T } | null>({
      url: path,
      ...config,
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const payload = response.data;

    // Unwrap standard API envelope { data: ... }
    if (
      payload &&
      typeof payload === "object" &&
      "data" in (payload as Record<string, unknown>)
    ) {
      return (payload as { data: T }).data;
    }

    return payload as T;
  } catch (error) {
    throw normalizeError(error);
  }
}

// Keep old name for backward compatibility
export const apiFetch = apiRequest;
