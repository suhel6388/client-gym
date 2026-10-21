/**
 * Form actions for the auth screens, shaped for `next-form-handler`.
 *
 * Each action receives the submitted FormData, calls the axios functions from
 * `./api` (the single HTTP layer) and returns a `FormState`:
 *
 *   { success: true, message? }   -> the hook calls the form's onSuccess
 *   { success: false, error }    -> the hook calls the form's onError
 *
 * Errors the UI must act on (redirect, disable inputs, restart a cooldown) are
 * returned as `AUTH_ERRORS` constants so forms can compare constants instead
 * of parsing message text.
 */

import type { FormAction } from "next-form-handler";
import {
  ApiError,
  forgotPassword,
  login,
  resendOtp,
  resetPassword,
  setupGym,
} from "./api";

/** Friendly messages returned by the actions below. */
export const AUTH_ERRORS = {
  network: "Can't reach the server. Check your connection and try again.",
  generic: "Something went wrong. Please try again.",
  invalidCredentials:
    "Invalid email or password. Check your credentials and try again.",
  /** Login with an email that still needs OTP verification (backend 403). */
  unverified: "Your email isn't verified yet.",
  /** Signup with an email that already has an account (backend 409). */
  emailTaken: "An account with this email already exists.",
  /** setup-gym when the account already has a gym (backend 409). */
  gymExists: "Your gym is already set up.",
  /** The session cookie is missing/expired. */
  sessionExpired: "Your session expired. Please sign in again.",
  /** Resend OTP hit the backend rate limit (backend 429). */
  rateLimited: "Too many attempts. Please wait a moment and try again.",
  otpExpired: "That code has expired. Request a new one below.",
  otpLocked: "Too many attempts. Request a new code and try again.",
  otpInvalid: "Invalid code. Check the 6-digit code and try again.",
} as const;

/** Read a text field from the submitted form. */
function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}

/** Turn any thrown error into a message that is safe to show the user. */
export function friendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    // status 0 = the request never reached the server.
    if (error.status === 0) return AUTH_ERRORS.network;
    return error.message || AUTH_ERRORS.generic;
  }
  return AUTH_ERRORS.generic;
}

const normalizeEmail = (value: string) => value.trim().toLowerCase();

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

/** POST /auth/login — 403 + EMAIL_NOT_VERIFIED means the OTP screen is next. */
export const loginAction: FormAction = async (_state, formData) => {
  try {
    await login({
      email: normalizeEmail(field(formData, "email")),
      password: field(formData, "password"),
      rememberMe: field(formData, "rememberMe") === "true",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 403 && error.code === "EMAIL_NOT_VERIFIED") {
        return { success: false, error: AUTH_ERRORS.unverified };
      }
      if (error.status === 401) {
        return { success: false, error: AUTH_ERRORS.invalidCredentials };
      }
    }
    return { success: false, error: friendlyError(error) };
  }
};

/** POST /auth/resend-otp — sends a fresh OTP (rate-limited server-side). */
export const resendOtpAction: FormAction = async (_state, formData) => {
  try {
    await resendOtp(normalizeEmail(field(formData, "email")));
    return { success: true, message: "A new code was sent to your email." };
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      return { success: false, error: AUTH_ERRORS.rateLimited };
    }
    return { success: false, error: friendlyError(error) };
  }
};

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

/** POST /auth/forgot-password — emails a reset link (never reveals accounts). */
export const forgotPasswordAction: FormAction = async (_state, formData) => {
  try {
    await forgotPassword(normalizeEmail(field(formData, "email")));
    return { success: true };
  } catch (error) {
    return { success: false, error: friendlyError(error) };
  }
};

/** POST /auth/reset-password — completes the reset with the emailed token. */
export const resetPasswordAction: FormAction = async (_state, formData) => {
  try {
    await resetPassword(field(formData, "token"), field(formData, "password"));
    return { success: true };
  } catch (error) {
    return { success: false, error: friendlyError(error) };
  }
};

// ---------------------------------------------------------------------------
// Gym setup (after signup verification / Google sign-in)
// ---------------------------------------------------------------------------

/** POST /auth/setup-gym — creates the gym and starts the 14-day trial. */
export const setupGymAction: FormAction = async (_state, formData) => {
  const email = normalizeEmail(field(formData, "email"));
  const phone = field(formData, "phone").trim();
  const address = field(formData, "address").trim();
  try {
    await setupGym({
      name: field(formData, "name").trim(),
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 409) {
        return { success: false, error: AUTH_ERRORS.gymExists };
      }
      if (error.status === 401) {
        return { success: false, error: AUTH_ERRORS.sessionExpired };
      }
      if (error.status === 403 && error.code === "EMAIL_NOT_VERIFIED") {
        return { success: false, error: AUTH_ERRORS.unverified };
      }
    }
    return { success: false, error: friendlyError(error) };
  }
};
