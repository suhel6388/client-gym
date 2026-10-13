"use client";

import {
  CalendarDays,
  Clock,
  Copy,
  Hash,
  Pencil,
  StickyNote,
  Trash,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrencyInr, formatLongDate } from "@/lib/format";
import { formatShortDayLabel, formatTimeOfDay } from "@/lib/date-window";
import { paiseToAmount } from "@/lib/members-api";
import type { ExpenseRow } from "@/lib/expenses-view";
import { categoryIcon } from "./ExpenseCategoryBadge";
import { Button } from "./ui/Button";

type ExpenseDetailsDrawerProps = {
  row: ExpenseRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (row: ExpenseRow) => void;
  onDelete: (row: ExpenseRow) => void;
  onCopy: (row: ExpenseRow) => void;
};

export function ExpenseDetailsDrawer({
  row,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onCopy,
}: ExpenseDetailsDrawerProps) {
  const Icon = row ? categoryIcon(row.category) : Wallet;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-card shadow-pop transition-transform duration-300 sm:max-w-[500px]",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-details-title"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line/60 px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <Wallet className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <h2 id="expense-details-title" className="text-sm font-semibold text-ink">
              Expense details
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="inline-flex size-8 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-card-hover hover:text-ink"
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        {row && (
          <div className="scroll-thin flex-1 overflow-y-auto px-6 py-6">
            {/* Amount hero */}
            <div className="rounded-xl border border-gold/25 bg-gradient-to-b from-gold/[0.1] to-transparent p-5 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                Amount
              </p>
              <p className="mt-2 text-[32px] leading-none font-bold tracking-tight text-gold tabular-nums">
                {formatCurrencyInr(paiseToAmount(row.amountPaise))}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-card-hover/70 px-2.5 py-1 text-[11px] font-medium text-subtle ring-1 ring-inset ring-line">
                <Icon className="size-3" strokeWidth={1.75} aria-hidden />
                {row.category}
              </span>
            </div>

            <h3 className="mt-5 text-[15px] font-semibold text-ink">{row.title}</h3>

            <dl className="mt-4 divide-y divide-line/40 rounded-xl border border-line/60">
              <Field
                icon={Hash}
                label="Expense ID"
                value={<span className="font-mono text-subtle">#{row.id}</span>}
              />
              <Field
                icon={CalendarDays}
                label="Expense date"
                value={formatLongDate(row.dateKey)}
              />
              <Field
                icon={Clock}
                label="Created"
                value={
                  row.createdAt
                    ? `${formatShortDayLabel(row.createdAt.slice(0, 10))} · ${formatTimeOfDay(row.createdAt)}`
                    : "—"
                }
              />
              <Field
                icon={StickyNote}
                label="Notes"
                value={
                  row.notes ? (
                    <span className="whitespace-pre-wrap text-subtle">{row.notes}</span>
                  ) : (
                    "—"
                  )
                }
              />
            </dl>

            <p className="mt-4 text-[11px] leading-relaxed text-faint">
              Amount is stored in paise ({amountPaiseLabel(row)}) and displayed in rupees.
            </p>
          </div>
        )}

        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-line/60 px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={!row}
            onClick={() => row && onDelete(row)}
            className="mr-auto text-danger hover:bg-danger/10"
          >
            <Trash className="size-4" strokeWidth={1.75} aria-hidden />
            Delete
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={!row}
            onClick={() => row && onCopy(row)}
          >
            <Copy className="size-4" strokeWidth={1.75} aria-hidden />
            Copy
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!row}
            onClick={() => row && onEdit(row)}
          >
            <Pencil className="size-4" strokeWidth={2} aria-hidden />
            Edit
          </Button>
        </div>
      </aside>
    </>
  );
}

function amountPaiseLabel(row: ExpenseRow): string {
  return `${row.amountPaise.toLocaleString("en-IN")} paise`;
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hash;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-card-hover text-faint">
        <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
          {label}
        </dt>
        <dd className="mt-0.5 text-[13px] text-ink">{value}</dd>
      </div>
    </div>
  );
}
