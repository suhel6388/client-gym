"use client";

import { useState, useEffect, useCallback } from "react";
import { Receipt, Search, Filter, RefreshCw, CheckCircle, Clock, XCircle } from "lucide-react";
import { listAllPlatformPayments, type PlatformPaymentDetail } from "@/lib/api/billing";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function SuperAdminPlatformPaymentsPage() {
  const [payments, setPayments] = useState<PlatformPaymentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listAllPlatformPayments({
        page,
        limit: 25,
        status: statusFilter || undefined,
        q: searchQuery.trim() || undefined,
      });
      setPayments(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load platform payments");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPayments();
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return (
          <Badge className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Paid
          </Badge>
        );
      case "PENDING":
      case "CREATED":
        return (
          <Badge className="bg-amber-950/60 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-rose-950/60 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Failed
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Platform Payment Ledger
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Audit Razorpay transactions across all gyms on the platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={loadPayments}
            disabled={loading}
            className="border-zinc-800 text-zinc-400 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by Gym name, Order ID, or Payment ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success (Paid)</option>
            <option value="PENDING">Pending / Created</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-400">Loading platform payments...</div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-12 text-center text-xs text-zinc-500">
          No platform payments matching the filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Gym Tenant</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {payments.map((p) => {
                  const dateStr = p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">{dateStr}</td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {p.gym?.name || p.gymName || "Gym " + p.gymId?.slice(-6)}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">{p.plan?.name || p.planName || "Subscription"}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">{p.orderId || "—"}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">{p.paymentId || "—"}</td>
                      <td className="py-3 px-4 font-bold text-white">
                        ₹{(p.amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(p.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3 text-xs text-zinc-400">
            <span>Total {totalCount} records</span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 text-xs border-zinc-800"
              >
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 text-xs border-zinc-800"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
