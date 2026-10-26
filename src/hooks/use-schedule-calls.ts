"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchScheduleCallsPage,
  type ScheduleCallDto,
  type ScheduleCallListResponse,
  type ScheduleCallStatusFilter,
} from "@/lib/api";
import { filterScheduleCalls } from "@/lib/schedule-call-view";

export type UseScheduleCallsOptions = {
  /** Already-debounced search term. */
  q?: string;
  status?: ScheduleCallStatusFilter;
  page?: number;
  limit?: number;
  enabled?: boolean;
};

export type ScheduleCallsState = {
  calls: ScheduleCallDto[];
  total: number;
  page: number;
  totalPages: number;
  /** True when the backend answered with pagination metadata. */
  serverPaged: boolean;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

const EMPTY_STATE = {
  calls: [] as ScheduleCallDto[],
  total: 0,
  page: 1,
  totalPages: 1,
  serverPaged: false,
};

type NormalizedResult = Omit<ScheduleCallsState, "loading" | "error" | "reload">;

function normalizeResult(
  raw: ScheduleCallListResponse | null,
  query: Required<Pick<UseScheduleCallsOptions, "page" | "limit">> & {
    q: string;
    status: ScheduleCallStatusFilter;
  },
): NormalizedResult {
  const rows = Array.isArray(raw?.data) ? raw.data : [];
  const pagination = raw?.pagination;

  if (pagination && Number.isFinite(pagination.total)) {
    return {
      calls: rows,
      total: pagination.total,
      page: pagination.page || query.page,
      totalPages: Math.max(1, pagination.totalPages || 1),
      serverPaged: true,
    };
  }

  // Older backend deployments ignore the query string. Filter and paginate the
  // full response locally so search/filters/pagination still behave correctly.
  const filtered = filterScheduleCalls(rows, query.q, query.status);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / query.limit));
  const start = (query.page - 1) * query.limit;

  return {
    calls: filtered.slice(start, start + query.limit),
    total,
    page: query.page,
    totalPages,
    serverPaged: false,
  };
}

/**
 * Loads schedule-call enquiries with search, status and pagination.
 *
 * The endpoint supports server-side paging. If the currently deployed backend
 * ignores those parameters, the full response is filtered locally instead of
 * showing unfiltered rows.
 */
export function useScheduleCalls({
  q = "",
  status = "",
  page = 1,
  limit = 10,
  enabled = true,
}: UseScheduleCallsOptions = {}): ScheduleCallsState {
  const [result, setResult] = useState<NormalizedResult>(EMPTY_STATE);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);

    fetchScheduleCallsPage(
      { q, status, page, limit },
      controller.signal,
    )
      .then((response) => {
        if (!active) return;
        setResult(normalizeResult(response, { q, status, page, limit }));
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Couldn't load schedule call enquiries.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [q, status, page, limit, enabled, reloadKey]);

  return {
    ...result,
    loading,
    error,
    reload,
  };
}
