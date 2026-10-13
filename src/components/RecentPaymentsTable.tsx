"use client";

import { Download, FileDown, RefreshCcw } from "lucide-react";
import type { PaymentStatus } from "@/lib/data";
import { recentPayments } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { formatLongDate } from "@/lib/format";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { DashboardCard } from "./DashboardCard";

const statusTone: Record<PaymentStatus, "success" | "warning" | "danger" | "muted"> = {
  Paid: "success",
  Pending: "warning",
  Failed: "danger",
  Refunded: "muted",
};

export function RecentPaymentsTable() {
  return (
    <DashboardCard
      title="Recent Payments"
      subtitle="Latest transactions across all plans"
      icon={FileDown}
      delay={0}
      action={
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-subtle transition-colors hover:bg-card-hover hover:text-ink"
        >
          <Download className="size-3.5" aria-hidden />
          Export
        </button>
      }
      menuItems={[
        { label: "Download CSV", icon: Download },
        { label: "View all payments", icon: RefreshCcw },
      ]}
      bodyClassName="pt-4"
    >
      <div className="-mx-5 overflow-x-auto scroll-thin px-5">
        <table className="w-full min-w-[680px] text-left">
          <thead>
            <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
              <th scope="col" className="pb-2.5 pr-4 font-semibold">
                Invoice
              </th>
              <th scope="col" className="pb-2.5 pr-4 font-semibold">
                Member
              </th>
              <th scope="col" className="pb-2.5 pr-4 font-semibold">
                Plan
              </th>
              <th scope="col" className="hidden pb-2.5 pr-4 font-semibold md:table-cell">
                Method
              </th>
              <th scope="col" className="pb-2.5 pr-4 text-right font-semibold">
                Amount
              </th>
              <th scope="col" className="hidden pb-2.5 pr-4 font-semibold lg:table-cell">
                Date
              </th>
              <th scope="col" className="pb-2.5 text-right font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {recentPayments.map((payment, index) => (
              <tr
                key={payment.id}
                className="group border-b border-line/60 transition-colors last:border-0 hover:bg-card-hover/50"
              >
                <td className="py-3 pr-4">
                  <span className="text-[13px] font-medium tabular-nums text-subtle group-hover:text-ink">
                    {payment.id}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <Avatar initials={payment.initials} index={index} className="size-8 text-[10px]" />
                    <span className="whitespace-nowrap text-[13px] font-medium text-ink">
                      {payment.member}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap py-3 pr-4 text-[13px] text-subtle">
                  {payment.plan}
                </td>
                <td className="hidden whitespace-nowrap py-3 pr-4 text-[13px] text-subtle md:table-cell">
                  {payment.method}
                </td>
                <td className="py-3 pr-4 text-right text-[13px] font-semibold tabular-nums text-ink">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="hidden whitespace-nowrap py-3 pr-4 text-[13px] tabular-nums text-faint lg:table-cell">
                  {formatLongDate(payment.date)}
                </td>
                <td className="py-3 text-right">
                  <Badge tone={statusTone[payment.status]} dot>
                    {payment.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}