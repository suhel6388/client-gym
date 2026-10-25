"use client";

import { Loader2, ShieldCheck, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  createReceptionist,
  type ReceptionistDto,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  emptyStaffForm,
  toCreateStaffInput,
  validateStaffForm,
  type StaffFormErrors,
  type StaffFormValues,
} from "@/lib/staff";
import { useToast } from "./providers/ToastProvider";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

const FORM_ID = "staff-form";

type AddStaffDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (staff: ReceptionistDto) => void;
  /** Existing staff emails, used for an immediate duplicate check. */
  existingEmails?: string[];
};

export function AddStaffDrawer({
  open,
  onOpenChange,
  onCreated,
  existingEmails = [],
}: AddStaffDrawerProps) {
  const toast = useToast();
  const [values, setValues] = useState<StaffFormValues>(emptyStaffForm);
  const [errors, setErrors] = useState<StaffFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(emptyStaffForm());
    setErrors({});
    setServerError(null);
    setSubmitting(false);
  }, [open]);

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

  const setField = <K extends keyof StaffFormValues>(
    key: K,
    value: StaffFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const found = validateStaffForm(values, existingEmails);
      setErrors(found);
      if (Object.keys(found).length > 0) return;

      setServerError(null);
      setSubmitting(true);
      try {
        const created = await toast.promise(
          createReceptionist(toCreateStaffInput(values)),
          {
            loading: {
              title: "Creating staff login…",
              description: "Setting up dashboard access for this staff member.",
            },
            success: (staff) => ({
              title: "Staff login created",
              description: `${staff.name} can now sign in with ${staff.email}.`,
            }),
            error: (caught) => ({
              title: "Couldn't create staff login",
              description:
                caught instanceof ApiError
                  ? caught.message
                  : "Something went wrong. Please try again.",
            }),
          },
        );
        onCreated?.(created);
        onOpenChange(false);
      } catch (caught) {
        setServerError(
          caught instanceof ApiError
            ? caught.message
            : "Something went wrong while creating the account. Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [existingEmails, onCreated, onOpenChange, toast, values],
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
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-card shadow-pop transition-transform duration-300 sm:max-w-lg",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-drawer-title"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line/60 px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <UserPlus className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <h2 id="staff-drawer-title" className="text-sm font-semibold text-ink">
              Create staff login
            </h2>
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
            <div
              role="alert"
              className="mb-5 rounded-lg border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-xs font-medium text-danger"
            >
              {serverError}
            </div>
          )}

          <div className="space-y-5">
            <div className="rounded-xl border border-line bg-card-hover/30 px-4 py-3">
              <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
                <ShieldCheck className="size-4 text-gold" strokeWidth={1.75} aria-hidden />
                Receptionist access
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-faint">
                Staff can view the dashboard and add records. They cannot edit or
                delete existing records, manage staff, or change billing.
              </p>
            </div>

            <div>
              <Label htmlFor="staff-name">Full name</Label>
              <Input
                id="staff-name"
                className="mt-1.5"
                value={values.name}
                onChange={(event) => setField("name", event.target.value)}
                placeholder="e.g. Front Desk"
                autoComplete="name"
                autoFocus
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <p className="mt-1.5 text-[11px] font-medium text-danger">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                className="mt-1.5"
                value={values.email}
                onChange={(event) => setField("email", event.target.value)}
                placeholder="desk@example.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && (
                <p className="mt-1.5 text-[11px] font-medium text-danger">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="staff-phone">
                Phone <span className="text-faint">(optional)</span>
              </Label>
              <Input
                id="staff-phone"
                type="tel"
                className="mt-1.5"
                value={values.phone}
                onChange={(event) => setField("phone", event.target.value)}
                placeholder="9876543210"
                autoComplete="tel"
                aria-invalid={Boolean(errors.phone)}
              />
              {errors.phone && (
                <p className="mt-1.5 text-[11px] font-medium text-danger">
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="staff-password">Password</Label>
                <Input
                  id="staff-password"
                  type="password"
                  className="mt-1.5"
                  value={values.password}
                  onChange={(event) => setField("password", event.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                />
                {errors.password ? (
                  <p className="mt-1.5 text-[11px] font-medium text-danger">
                    {errors.password}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-faint">
                    8–128 characters.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="staff-confirm-password">Confirm password</Label>
                <Input
                  id="staff-confirm-password"
                  type="password"
                  className="mt-1.5"
                  value={values.confirmPassword}
                  onChange={(event) =>
                    setField("confirmPassword", event.target.value)
                  }
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                />
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-[11px] font-medium text-danger">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-faint">
              The account is created already verified, so the staff member can
              sign in immediately. Share the password with them securely.
            </p>
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
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            size="md"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
            ) : (
              <UserPlus className="size-4" strokeWidth={2} aria-hidden />
            )}
            {submitting ? "Creating…" : "Create login"}
          </Button>
        </div>
      </aside>
    </>
  );
}
