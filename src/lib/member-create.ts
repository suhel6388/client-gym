/**
 * Create-member flow.
 *
 * The backend exposes member, membership and payment as three separate
 * endpoints (there is no combined "create member" transaction). This module
 * runs them in the right order and distinguishes a failed member creation
 * (fatal — nothing was saved) from a failed follow-up (the member exists, so
 * retrying the whole form would create a duplicate).
 */

import {
  createMember,
  createMembership,
  createPayment,
  type MemberDto,
} from "./api";
import { amountToPaise } from "./members-api";
import { toMemberInput, type MemberFormValues } from "./member-form";

export type CreateMemberResult = {
  member: MemberDto;
  /** Non-fatal problems that happened after the member row was created. */
  warnings: string[];
};

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function createMemberFromForm(
  values: MemberFormValues,
): Promise<CreateMemberResult> {
  // The form validates both fields, but re-check before creating the member so
  // this flow can never produce a member without the required membership.
  if (!values.planId) throw new Error("Membership plan is required.");
  if (!values.startDate) throw new Error("Start date is required.");

  // Fatal: if this throws, no member exists and the form can be retried.
  const member = await createMember(toMemberInput(values));

  const warnings: string[] = [];
  let membershipCreated = false;

  try {
    await createMembership({
      memberId: member.id,
      planId: values.planId,
      startDate: values.startDate,
      discountPaise: Math.max(
        0,
        Math.round((Number(values.discount) || 0) * 100),
      ),
    });
    membershipCreated = true;
  } catch (error) {
    warnings.push(
      `Membership could not be created: ${errorMessage(error, "unknown error")}`,
    );
  }

  // Don't take a payment for a membership that was never attached — that would
  // leave the payment ledger inconsistent.
  if (values.collectPayment && membershipCreated) {
    try {
      await createPayment({
        memberId: member.id,
        amount: amountToPaise(Number(values.amount) || 0),
        paymentMode: values.paymentMode,
        reference: values.reference.trim() || null,
        paymentDate: values.paymentDate,
        status: "SUCCESS",
      });
    } catch (error) {
      warnings.push(
        `Payment could not be recorded: ${errorMessage(error, "unknown error")}`,
      );
    }
  } else if (values.collectPayment) {
    warnings.push("Payment was not recorded because the membership failed.");
  }

  return { member, warnings };
}
