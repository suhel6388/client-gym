"use client";

import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { emitMemberCreated } from "@/lib/events";
import { createMemberFromForm } from "@/lib/member-create";
import {
  emptyMemberForm,
  type MemberFormValues,
} from "@/lib/member-form";
import { listPlans, type PlanDto } from "@/lib/members-api";
import { MemberForm } from "./MemberForm";
import { useToast } from "./providers/ToastProvider";
import { Button } from "./ui/Button";

const FORM_ID = "add-member-page-form";

export function AddMemberPageClient() {
  const router = useRouter();
  const toast = useToast();

  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listPlans()
      .then((data) => active && setPlans(data))
      .catch((error: unknown) => {
        if (!active) return;
        setPlansError(
          error instanceof ApiError ? error.message : "Couldn't load plans.",
        );
      })
      .finally(() => active && setPlansLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = useCallback(
    async (values: MemberFormValues) => {
      setServerError(null);
      setSubmitting(true);
      try {
        const result = await toast.promise(
          createMemberFromForm(values),
          {
            loading: {
              title: "Adding member…",
              description: values.collectPayment
                ? "Creating the member, membership and payment. Please wait…"
                : "Creating the member and membership. Please wait…",
            },
            success: ({ member }) => ({
              title: "Member added",
              description: `${member.name} (${member.memberCode}) was added successfully.`,
            }),
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

        emitMemberCreated(result.member);
        router.push("/members");
      } catch (caught) {
        setServerError(
          caught instanceof ApiError
            ? caught.message
            : "Something went wrong while saving. Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [router, toast],
  );

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex items-center gap-3 animate-fade-up">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to members"
          disabled={submitting}
          onClick={() => router.push("/members")}
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
        </Button>
        <div>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
            Add new member
          </h1>
          <p className="mt-1 text-sm text-subtle">
            Fill in the details below to add a member to your gym.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-card border border-line bg-card p-4 shadow-card animate-fade-up sm:p-6">
        {plansError && (
          <div className="mb-5 rounded-lg border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-xs font-medium text-warning">
            {plansError} A membership plan is required, so retry once plans load.
          </div>
        )}

        <MemberForm
          formId={FORM_ID}
          mode="create"
          initialValues={emptyMemberForm()}
          plans={plans}
          plansLoading={plansLoading}
          submitting={submitting}
          serverError={serverError}
          onSubmit={handleSubmit}
        />

        <div className="mt-7 flex flex-col-reverse gap-2 border-t border-line/60 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={submitting}
            onClick={() => router.push("/members")}
          >
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" size="md" disabled={submitting}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
            ) : (
              <UserPlus className="size-4" strokeWidth={2} aria-hidden />
            )}
            {submitting ? "Saving…" : "Save member"}
          </Button>
        </div>
      </div>
    </div>
  );
}
