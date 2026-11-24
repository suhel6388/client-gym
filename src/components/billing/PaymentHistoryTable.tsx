"use client";

import { useState, useEffect } from "react";
import { Receipt, CheckCircle, Clock, XCircle } from "lucide-react";
import { fetchPaymentHistory, type SubscriptionHistoryItem } from "@/lib/api/billing";
import { Badge } from "@/components/ui/Badge";

export function PaymentHistoryTable() {
  const [payments, setPayments] = useState<SubscriptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetchPaymentHistory(1, 50);
        if (active) {
          setPayments(res.data || []);
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load payment history");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

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

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-400">
        Loading payment transactions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 p-6 text-center text-sm text-rose-300">
        {error}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
        <Receipt className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
        <h4 className="text-sm font-semibold text-zinc-300">No payment history yet</h4>
        <p className="text-xs text-zinc-500 mt-1">
          When you purchase or renew a subscription plan, invoices and transaction records will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-zinc-300">
          <thead className="bg-zinc-900/80 border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Plan</th>
              <th className="py-3.5 px-4">Order ID</th>
              <th className="py-3.5 px-4">Amount</th>
              <th className="py-3.5 px-4">Status</th>
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
                  <td className="py-3.5 px-4 text-zinc-400 font-mono text-xs">{dateStr}</td>
                  <td className="py-3.5 px-4 font-medium text-white">{p.planName || p.plan?.name || "Subscription"}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-zinc-500">{p.orderId || "—"}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    ₹{(p.amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
