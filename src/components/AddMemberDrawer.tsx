"use client";

import { Loader2, Pencil, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { ApiError } from "@/lib/api";
import {
  emitMemberCreated,
  emitMemberUpdated,
} from "@/lib/events";
import {
  emptyMemberForm,
  memberToFormValues,
  toMemberInput,
  type MemberFormValues,
} from "@/lib/member-form";
import { createMemberFromForm } from "@/lib/member-create";
import {
  listPlans,
  updateMember,
  type MemberDto,
  type PlanDto,
} from "@/lib/members-api";
import { useToast } from "./providers/ToastProvider";
import { MemberForm } from "./MemberForm";
import { Button } from "./ui/Button";

const FORM_ID = "member-form";

type AddMemberDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided the drawer edits this member instead of creating one. */
  member?: MemberDto | null;
  onSaved?: (member: MemberDto) => void;
};

function buildPayload(values: MemberFormValues) {
  return toMemberInput(values);
}

export function AddMemberDrawer({
  open,
  onOpenChange,
  member = null,
  onSaved,
}: AddMemberDrawerProps) {
  const mode = member ? "edit" : "create";
  const toast = useToast();

  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const initialValues = useMemo(
    () => (member ? memberToFormValues(member) : emptyMemberForm()),
    [member],
  );

  // The edit drawer does not fetch the plan list, so include the member's
  // current plan to keep the read-only select and fee preview populated.
  const formPlans = useMemo(() => {
    if (mode !== "edit" || !member) return plans;
    const current = member.memberships?.[0]?.plan;
    if (!current || plans.some((plan) => plan.id === current.id)) return plans;
    return [current, ...plans];
  }, [mode, member, plans]);

  // Fetch plans whenever the drawer opens in create mode.
  useEffect(() => {
    if (!open || mode === "edit") return;
    let active = true;
    setPlansLoading(true);
    setPlansError(null);
    listPlans()
      .then((data) => {
        if (active) setPlans(data);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPlansError(
          error instanceof ApiError ? error.message : "Couldn't load plans.",
        );
      })
      .finally(() => {
        if (active) setPlansLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, mode]);

  // Reset transient state each time the drawer opens.
  useEffect(() => {
    if (open) {
      setServerError(null);
      setSubmitting(false);
      setFormKey((key) => key + 1);
    }
  }, [open, member]);

  // Close on Escape and lock page scroll while open.
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

  const handleSubmit = useCallback(
    async (values: MemberFormValues) => {
      setServerError(null);
      setSubmitting(true);
      try {
        const result = await toast.promise(
          (async () => {
            if (mode === "edit" && member) {
              const updated = await updateMember(member.id, buildPayload(values));
              return { member: updated, warnings: [] as string[] };
            }
            return createMemberFromForm(values);
          })(),
          {
            loading:
              mode === "edit"
                ? {
                    title: "Saving member…",
                    description: "Updating the member profile. Please wait…",
                  }
                : {
                    title: "Adding member…",
                    description: values.collectPayment
                      ? "Creating the member, membership and payment. Please wait…"
                      : "Creating the member and membership. Please wait…",
                  },
            success: ({ member: saved }) =>
              mode === "edit"
                ? {
                    title: "Member updated",
                    description: `${saved.name}'s details were saved.`,
                  }
                : {
                    title: "Member added",
                    description: `${saved.name} (${saved.memberCode}) was added successfully.`,
                  },
            error: (error) => ({
              title: "Couldn't save member",
              description:
                error instanceof ApiError
                  ? error.message
                  : "Something went wrong while saving. Please try again.",
            }),
          },
        );

        if (result.warnings.length) {
          toast.warning(
            "Member added with warnings",
            result.warnings.join(" "),
            { persistent: true },
          );
        }

        if (mode === "edit") {
          emitMemberUpdated(result.member);
        } else {
          emitMemberCreated(result.member);
        }
        onSaved?.(result.member);
        onOpenChange(false);
      } catch (error) {
        setServerError(
          error instanceof ApiError
            ? error.message
            : "Something went wrong while saving. Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [mode, member, onOpenChange, onSaved, toast],
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
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-card shadow-pop transition-transform duration-300 sm:max-w-xl",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-drawer-title"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line/60 px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              {mode === "edit" ? (
                <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
              ) : (
                <UserPlus className="size-4" strokeWidth={1.75} aria-hidden />
              )}
            </span>
            <h2 id="member-drawer-title" className="text-sm font-semibold text-ink">
              {mode === "edit" ? "Edit member" : "Add new member"}
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

        <div className="scroll-thin flex-1 overflow-y-auto px-6 py-6">
          {plansError && (
            <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-xs font-medium text-warning">
              {plansError} A membership plan is required, so retry once plans
              load.
            </div>
          )}
          <MemberForm
            key={formKey}
            formId={FORM_ID}
            mode={mode}
            initialValues={initialValues}
            plans={formPlans}
            plansLoading={plansLoading}
            submitting={submitting}
            serverError={serverError}
            onSubmit={handleSubmit}
          />
        </div>

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
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
            ) : mode === "edit" ? (
              <Pencil className="size-4" strokeWidth={2} aria-hidden />
            ) : (
              <UserPlus className="size-4" strokeWidth={2} aria-hidden />
            )}
            {submitting
              ? "Saving…"
              : mode === "edit"
                ? "Save changes"
                : "Add member"}
          </Button>
        </div>
      </aside>
    </>
  );
}
