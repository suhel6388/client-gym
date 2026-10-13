"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./ui/Button";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
        onClick={() => !loading && onCancel()}
        aria-hidden="true"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-md animate-pop rounded-card border border-line-strong bg-elevated p-6 shadow-pop"
      >
        <h2 id="confirm-title" className="text-base font-semibold text-ink">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-subtle">{description}</p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="md"
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              tone === "danger" &&
                "bg-danger font-semibold text-[#2a0b0b] shadow-none hover:brightness-110",
            )}
          >
            {loading && (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
            )}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
