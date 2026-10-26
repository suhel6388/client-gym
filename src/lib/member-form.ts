import type {
  MemberDto,
  MemberInput,
  PaymentModeDto,
  PlanDto,
  TimingDto,
} from "./members-api";
import { addMonths } from "./members-api";

export type Gender =
  | "male"
  | "female"
  | "other"
  | "prefer-not-to-say"
  | "";

/** Empty while the member has not picked a batch yet. */
export type BatchTiming = TimingDto | "";

export type MemberFormValues = {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  timing: BatchTiming;
  planId: string;
  startDate: string;
  /** Discount in major units (e.g. rupees), as typed by the user. */
  discount: string;
  collectPayment: boolean;
  /** Payment amount in major units, prefilled from the computed fee. */
  amount: string;
  paymentMode: PaymentModeDto;
  reference: string;
  paymentDate: string;
  notes: string;
};

export type MemberFormErrors = Partial<Record<keyof MemberFormValues, string>>;

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

export const TIMING_OPTIONS: { value: TimingDto; label: string }[] = [
  { value: "MORNING", label: "Morning" },
  { value: "AFTERNOON", label: "Afternoon" },
  { value: "EVENING", label: "Evening" },
];

export const PAYMENT_MODE_OPTIONS: { value: PaymentModeDto; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "OTHER", label: "Other" },
];

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function emptyMemberForm(): MemberFormValues {
  return {
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    timing: "",
    planId: "",
    startDate: todayIso(),
    discount: "0",
    collectPayment: false,
    amount: "",
    paymentMode: "CASH",
    reference: "",
    paymentDate: todayIso(),
    notes: "",
  };
}

function toIsoDate(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function memberToFormValues(member: MemberDto): MemberFormValues {
  const membership = member.memberships?.[0] ?? null;
  return {
    name: member.name,
    email: member.email ?? "",
    phone: member.phone,
    dateOfBirth: toIsoDate(member.dateOfBirth),
    gender: (member.gender as Gender) ?? "",
    address: member.address ?? "",
    emergencyContact: member.emergencyContact ?? "",
    emergencyPhone: member.emergencyPhone ?? "",
    timing: member.timing,
    planId: membership?.planId ?? "",
    startDate: toIsoDate(membership?.startDate) || todayIso(),
    discount: membership ? String(membership.discountPaise / 100) : "0",
    collectPayment: false,
    amount: "",
    paymentMode: "CASH",
    reference: "",
    paymentDate: todayIso(),
    notes: member.notes ?? "",
  };
}

/** Fee in paise after the discount, clamped at zero. */
export function computeFeePaise(plan: PlanDto | undefined, discount: string): number {
  if (!plan) return 0;
  const discountPaise = Math.max(0, Math.round((Number(discount) || 0) * 100));
  return Math.max(0, plan.pricePaise - discountPaise);
}

/** Expiry ISO date derived from the plan duration. */
export function computeExpiry(plan: PlanDto | undefined, startDate: string): string | null {
  if (!plan || !startDate) return null;
  const value = addMonths(startDate, plan.durationMonths);
  return Number.isNaN(new Date(value).getTime()) ? null : value;
}

export function fullName(values: MemberFormValues): string {
  return values.name.trim().replace(/\s+/g, " ");
}

/** Maps the form values onto the member payload the API expects. */
export function toMemberInput(values: MemberFormValues): MemberInput {
  return {
    name: fullName(values),
    phone: values.phone.trim(),
    email: values.email.trim(),
    dateOfBirth: values.dateOfBirth || null,
    gender: values.gender || null,
    address: values.address.trim() || null,
    emergencyContact: values.emergencyContact.trim() || null,
    emergencyPhone: values.emergencyPhone.trim() || null,
    // Validation blocks an empty timing, so this is always a real enum value.
    timing: values.timing || "MORNING",
    joinedAt: values.startDate || undefined,
    notes: values.notes.trim() || null,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateMemberForm(
  values: MemberFormValues,
  { requireMembership = true }: { requireMembership?: boolean } = {},
): MemberFormErrors {
  const errors: MemberFormErrors = {};

  // Required: member details.
  if (!values.name.trim()) errors.name = "Member name is required.";

  if (!values.phone.trim()) errors.phone = "Mobile number is required.";
  else if (values.phone.replace(/\D/g, "").length < 7)
    errors.phone = "Enter a valid mobile number (at least 7 digits).";

  if (!values.gender) errors.gender = "Gender is required.";

  if (!values.dateOfBirth) {
    errors.dateOfBirth = "Date of birth is required.";
  } else {
    const dob = new Date(values.dateOfBirth);
    if (Number.isNaN(dob.getTime())) errors.dateOfBirth = "Enter a valid date.";
    else if (dob.getTime() > Date.now())
      errors.dateOfBirth = "Date of birth can't be in the future.";
  }

  // Required: batch timing.
  if (!values.timing) errors.timing = "Batch timing is required.";

  // The plan, start date and discount are required when creating a member.
  // The edit drawer only saves the member profile, so it does not force them.
  if (requireMembership) {
    if (!values.planId) errors.planId = "Membership plan is required.";

    if (!values.startDate) {
      errors.startDate = "Start date is required.";
    } else if (Number.isNaN(new Date(values.startDate).getTime())) {
      errors.startDate = "Enter a valid start date.";
    }

    if (!values.discount.trim()) {
      errors.discount = "Discount is required. Enter 0 for no discount.";
    } else {
      const discount = Number(values.discount);
      if (!Number.isFinite(discount) || discount < 0) {
        errors.discount = "Discount must be zero or more.";
      }
    }
  }

  // Everything below is optional: validate only when the user supplied it.
  if (values.email.trim() && !EMAIL_RE.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (values.collectPayment) {
    const amount = Number(values.amount);
    if (values.amount.trim() === "" || Number.isNaN(amount)) {
      errors.amount = "Enter the amount collected.";
    } else if (amount <= 0) {
      errors.amount = "Amount must be greater than zero.";
    }
    if (!values.paymentDate) errors.paymentDate = "Payment date is required.";
  }

  return errors;
}

export function hasErrors(errors: MemberFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
