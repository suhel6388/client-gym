import type { CreateReceptionistInput } from "./api";

/** Roles used by the backend (`User.role` in Prisma). */
export const OWNER_ROLE = "ADMIN";
export const STAFF_ROLE = "RECEPTIONIST";

export type StaffFormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type StaffFormErrors = Partial<Record<keyof StaffFormValues, string>>;

export function emptyStaffForm(): StaffFormValues {
  return {
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  };
}

/** Strip spaces, dashes and brackets the same way the auth signup does. */
export function normalizePhone(value: string): string {
  return value.trim().replace(/[\s\-()]/g, "");
}

export function isOwnerRole(role?: string | null): boolean {
  return role === OWNER_ROLE;
}

/**
 * Client-side mirror of the backend rules in
 * `backend/src/controllers/staff.controller.js`. The server remains the
 * authority; this only gives the owner immediate feedback.
 */
export function validateStaffForm(
  values: StaffFormValues,
  existingEmails: string[] = [],
): StaffFormErrors {
  const errors: StaffFormErrors = {};

  const name = values.name.trim();
  if (name.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  } else if (name.length > 100) {
    errors.name = "Name must be 100 characters or fewer.";
  }

  const email = values.email.trim().toLowerCase();
  if (!email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  } else if (existingEmails.some((existing) => existing.toLowerCase() === email)) {
    errors.email = "A staff account with this email already exists.";
  }

  const phone = normalizePhone(values.phone);
  if (phone && !/^\+?\d{10,15}$/.test(phone)) {
    errors.phone = "Enter a valid phone number (10–15 digits).";
  }

  if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (values.password.length > 128) {
    errors.password = "Password must be 128 characters or fewer.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm the password.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

/** Builds the exact payload accepted by `POST /api/v1/staff/receptionists`. */
export function toCreateStaffInput(values: StaffFormValues): CreateReceptionistInput {
  const phone = normalizePhone(values.phone);

  return {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    password: values.password,
    ...(phone ? { phone } : {}),
  };
}

/** Formats `User.createdAt` (ISO datetime) for the staff table. */
export function formatStaffAdded(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
