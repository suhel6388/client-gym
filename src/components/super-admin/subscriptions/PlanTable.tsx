"use client";

import { Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { type BillingPlan } from "@/lib/api/billing";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type PlanTableProps = {
  plans: BillingPlan[];
  onEdit: (plan: BillingPlan) => void;
  onToggleStatus: (plan: BillingPlan) => void;
  onDelete: (plan: BillingPlan) => void;
};

export function PlanTable({ plans, onEdit, onToggleStatus, onDelete }: PlanTableProps) {
  if (plans.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-12 text-center text-sm text-zinc-400">
        No subscription plans created yet. Click &quot;Create Plan&quot; to add the first tier.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-zinc-300">
          <thead className="bg-zinc-900/80 border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Plan</th>
              <th className="py-3.5 px-4">Code</th>
              <th className="py-3.5 px-4">Price</th>
              <th className="py-3.5 px-4">Duration</th>
              <th className="py-3.5 px-4">Limits</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {plans.map((p) => {
              const priceRupees = Math.round(p.pricePaise / 100);
              return (
                <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-white block">{p.name}</span>
                    <span className="text-xs text-zinc-500 line-clamp-1">{p.description || "—"}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-amber-400">{p.code}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    ₹{priceRupees.toLocaleString("en-IN")}{" "}
                    <span className="text-[10px] text-zinc-500 font-normal">+{p.gstPercent ?? 18}% GST</span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300">
                    {p.durationDays ? `${p.durationDays} days` : `${p.durationMonths} mo`}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-zinc-400">
                    <div>Staff: {p.maxStaff ? p.maxStaff : "Unlimited"}</div>
                    <div>Branches: {p.maxBranches ? p.maxBranches : "1"}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(p)}
                      className="cursor-pointer"
                      title="Click to toggle active status"
                    >
                      {p.isActive ? (
                        <Badge className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 hover:bg-emerald-900/60">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1 hover:bg-zinc-700">
                          <XCircle className="h-3 w-3" /> Inactive
                        </Badge>
                      )}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(p)}
                        className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                        title="Edit Plan"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(p)}
                        className="h-8 w-8 p-0 text-zinc-400 hover:text-rose-400"
                        title="Delete Plan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
