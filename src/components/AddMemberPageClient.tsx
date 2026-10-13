"use client";

import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { emitMemberCreated } from "@/lib/events";
import {
  emptyMemberForm,
  toMemberInput,
  type MemberFormValues,
} from "@/lib/member-form";
import {
  amountToPaise,
  createMember,
  createMembership,
  createPayment,
  listPlans,
  type PlanDto,
} from "@/lib/members-api";
import { MemberForm } from "./MemberForm";
import { useGlobalLoading } from "./providers/LoadingProvider";
import { useToast } from "./providers/ToastProvider";
import { Button } from "./ui/Button";

const FORM_ID = "add-member-page-form";

export function AddMemberPageClient() {
  const router = useRouter();
  const toast = useToast();
  const loading = useGlobalLoading();

  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listPlans()
      .then((data) => active && setPlans(data))
      .catch(() => undefined)
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
        const saved = await loading.run(
          (async () => {
            const member = await createMember(toMemberInput(values));
            if (values.planId) {
              await createMembership({
                memberId: member.id,
                planId: values.planId,
                startDate: values.startDate || undefined,
                discountPaise: Math.max(
                  0,
                  Math.round((Number(values.discount) || 0) * 100),
                ),
              });
            }
            if (values.collectPayment) {
              await createPayment({
                memberId: member.id,
                amount: amountToPaise(Number(values.amount) || 0),
                paymentMode: values.paymentMode,
                reference: values.reference.trim() || null,
                paymentDate: values.paymentDate,
                status: "SUCCESS",
              });
            }
            return member;
          })(),
          "Adding member…",
        );

        toast.success(
          "Member added",
          `${saved.name} (${saved.memberCode}) was added successfully.`,
        );
        emitMemberCreated(saved);
        router.push("/members");
      } catch (caught) {
        const message =
          caught instanceof ApiError
            ? caught.message
            : "Something went wrong while saving. Please try again.";
        setServerError(message);
        toast.error("Couldn't save member", message);
      } finally {
        setSubmitting(false);
      }
    },
    [loading, router, toast],
  );

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex items-center gap-3 animate-fade-up">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to members"
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

      <div className="mt-6 rounded-card border border-line bg-card p-6 shadow-card animate-fade-up">
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
