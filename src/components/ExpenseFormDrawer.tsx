"use client";

import { BadgeIndianRupee, LoaderCircle, Wallet, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatCurrencyInr } from "@/lib/format";
import { todayIso } from "@/lib/member-form";
import { amountToPaise } from "@/lib/members-api";
import { EXPENSE_CATEGORIES, type ExpenseRow } from "@/lib/expenses-view";
import {
  createExpense,
  updateExpense,
  type ExpenseInput,
} from "@/lib/api";
import { useToast } from "./providers/ToastProvider";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";

const FORM_ID = "expense-form";

type ExpenseFormDrawerProps = {
  open: boolean;
  /** When set, the drawer edits this record instead of creating a new one. */
  editing: ExpenseRow | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function ExpenseFormDrawer({
  open,
  editing,
  onOpenChange,
  onSaved,
}: ExpenseFormDrawerProps) {
  const toast = useToast();
  const isEditing = Boolean(editing);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? "");
    setCategory(editing?.category ?? "");
    setAmount(editing ? String(editing.amountPaise / 100) : "");
    setExpenseDate(editing ? editing.dateKey : todayIso());
    setNotes(editing?.notes ?? "");
    setErrors({});
    setServerError(null);
    setSubmitting(false);
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, submitting, onOpenChange]);

  const amountValue = Number(amount);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const found: Record<string, string> = {};
      if (!title.trim()) found.title = "Title is required.";
      else if (title.trim().length > 120) found.title = "Keep the title under 120 characters.";
      if (!category) found.category = "Select a category.";
      if (!amount.trim() || !Number.isFinite(amountValue) || amountValue <= 0) {
        found.amount = "Enter an amount greater than zero.";
      }
      if (!expenseDate) found.expenseDate = "Expense date is required.";
      else if (Number.isNaN(new Date(expenseDate).getTime())) {
        found.expenseDate = "Enter a valid date.";
      }
      if (notes.length > 500) found.notes = "Keep notes under 500 characters.";

      setErrors(found);
      if (Object.keys(found).length > 0) return;

      const input: ExpenseInput = {
        title: title.trim(),
        category,
        amountPaise: amountToPaise(amountValue),
        expenseDate,
        notes: notes.trim(),
      };

      setServerError(null);
      setSubmitting(true);
      try {
        if (editing) {
          await toast.promise(updateExpense(editing.id, input), {
            loading: {
              title: "Saving expense…",
              description: "Updating the recorded expense.",
            },
            success: {
              title: "Expense updated",
              description: `"${input.title}" was saved.`,
            },
            error: (caught) => ({
              title: "Couldn't update expense",
              description:
                caught instanceof ApiError ? caught.message : "Please try again.",
            }),
          });
        } else {
          await toast.promise(createExpense(input), {
            loading: {
              title: "Recording expense…",
              description: "Adding the expense to your books.",
            },
            success: {
              title: "Expense added",
              description: `"${input.title}" was recorded.`,
            },
            error: (caught) => ({
              title: "Couldn't add expense",
              description:
                caught instanceof ApiError ? caught.message : "Please try again.",
            }),
          });
        }
        onSaved();
        onOpenChange(false);
      } catch (caught) {
        setServerError(
          caught instanceof ApiError ? caught.message : "Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      amount,
      amountValue,
      category,
      editing,
      expenseDate,
      notes,
      onOpenChange,
      onSaved,
      title,
      toast,
    ],
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => !submitting && onOpenChange(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[95vw] flex-col border-l border-line bg-card shadow-pop transition-transform duration-300 sm:max-w-[500px]",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-form-title"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line/60 px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <Wallet className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h2 id="expense-form-title" className="text-sm font-semibold text-ink">
                {isEditing ? "Edit Expense" : "Add New Expense"}
              </h2>
              <p className="text-[11px] text-faint">
                {isEditing
                  ? "Update the details of this expense."
                  : "Record a gym operating expense."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            disabled={submitting}
            className="inline-flex size-8 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-card-hover hover:text-ink disabled:opacity-50"
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        <form
          id={FORM_ID}
          onSubmit={handleSubmit}
          className="scroll-thin flex-1 overflow-y-auto px-6 py-6"
        >
          {serverError && (
            <div className="mb-5 rounded-lg border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-xs font-medium text-danger">
              {serverError}
            </div>
          )}

          {/* Title */}
          <div>
            <Label htmlFor="expense-title">Expense Title</Label>
            <Input
              id="expense-title"
              className="mt-1.5"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Equipment repair"
              maxLength={120}
              aria-invalid={Boolean(errors.title)}
              autoFocus
            />
            {errors.title && (
              <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.title}</p>
            )}
          </div>

          {/* Category */}
          <div className="mt-5">
            <Label htmlFor="expense-category">Category</Label>
            <Select
              id="expense-category"
              className="mt-1.5"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-invalid={Boolean(errors.category)}
            >
              <option value="" disabled>
                Select a category
              </option>
              {EXPENSE_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            {errors.category && (
              <p className="mt-1.5 text-[11px] font-medium text-danger">
                {errors.category}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="mt-5">
            <Label htmlFor="expense-amount">Amount</Label>
            <div className="relative mt-1.5">
              <BadgeIndianRupee
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
                strokeWidth={1.75}
                aria-hidden
              />
              <Input
                id="expense-amount"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                className="pl-9"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                aria-invalid={Boolean(errors.amount)}
              />
            </div>
            {errors.amount ? (
              <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.amount}</p>
            ) : amountValue > 0 ? (
              <p className="mt-1.5 text-[11px] text-faint">
                {formatCurrencyInr(amountValue)} will be recorded as{" "}
                <span className="tabular-nums">{amountToPaise(amountValue)}</span> paise.
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] text-faint">Enter the amount in rupees.</p>
            )}
          </div>

          {/* Date */}
          <div className="mt-5">
            <Label htmlFor="expense-date">Expense Date</Label>
            <Input
              id="expense-date"
              type="date"
              className="mt-1.5"
              value={expenseDate}
              onChange={(event) => setExpenseDate(event.target.value)}
              aria-invalid={Boolean(errors.expenseDate)}
            />
            {errors.expenseDate && (
              <p className="mt-1.5 text-[11px] font-medium text-danger">
                {errors.expenseDate}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <Label htmlFor="expense-notes">Notes (optional)</Label>
              <span className="text-[10px] tabular-nums text-faint">
                {notes.length}/500
              </span>
            </div>
            <Textarea
              id="expense-notes"
              className="mt-1.5"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="e.g. Treadmill service"
              maxLength={500}
              aria-invalid={Boolean(errors.notes)}
            />
            {errors.notes && (
              <p className="mt-1.5 text-[11px] font-medium text-danger">{errors.notes}</p>
            )}
          </div>
        </form>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line/60 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" size="md" disabled={submitting}>
            {submitting ? (
              <LoaderCircle className="size-4 animate-spin" strokeWidth={2} aria-hidden />
            ) : (
              <Wallet className="size-4" strokeWidth={2} aria-hidden />
            )}
            {submitting ? "Saving…" : isEditing ? "Save Changes" : "Save Expense"}
          </Button>
        </div>
      </aside>
    </>
  );
}
