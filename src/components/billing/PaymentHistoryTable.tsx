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
          <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Paid
          </Badge>
        );
      case "PENDING":
      case "CREATED":
        return (
          <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Failed
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-line bg-card p-8 text-center text-sm text-subtle">
        Loading payment transactions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-6 text-center text-sm text-rose-500">
        {error}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-card p-12 text-center">
        <Receipt className="mx-auto h-8 w-8 text-faint mb-2" />
        <h4 className="text-sm font-semibold text-ink">No payment history yet</h4>
        <p className="text-xs text-subtle mt-1">
          When you purchase or renew a subscription plan, invoices and transaction records will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-ink">
          <thead className="bg-canvas/70 border-b border-line text-xs font-semibold text-faint uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Plan</th>
              <th className="py-3.5 px-4">Order ID</th>
              <th className="py-3.5 px-4">Amount</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {payments.map((p) => {
              const dateStr = p.createdAt
                ? new Date(p.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—";

              return (
                <tr key={p.id} className="hover:bg-card-hover transition-colors">
                  <td className="py-3.5 px-4 text-subtle font-mono text-xs">{dateStr}</td>
                  <td className="py-3.5 px-4 font-medium text-ink">{p.planName || p.plan?.name || "Subscription"}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-faint">{p.orderId || "—"}</td>
                  <td className="py-3.5 px-4 font-semibold text-ink">
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
