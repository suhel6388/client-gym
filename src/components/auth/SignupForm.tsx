"use client";

import React, { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthErrorMessage } from "./AuthErrorMessage";
import { AuthDivider } from "./AuthDivider";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { PhoneInput } from "./PhoneInput";
import { ApiError, savePendingSignup, signup, warmUpApi } from "@/lib/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<"gymName" | "name" | "email" | "phone" | "password" | "confirm" | "terms", string>>;
type SignupFormProps = {
  /**
   * Called after the backend accepts the signup and sends the OTP.
   * `alreadyRegistered` is true when the email existed but was not verified —
   * the account was not duplicated and the user continues on the OTP screen.
   * `emailSent` is false when the account exists but the OTP email failed.
   */
  onSignupSuccess: (
    email: string,
    alreadyRegistered: boolean,
    emailSent: boolean,
  ) => void;
};

export function SignupForm({ onSignupSuccess }: SignupFormProps) {
  const [gymName, setGymName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [address, setAddress] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Start waking the API while the user fills the form. Render free instances
  // spin down when idle, and the signup POST would otherwise be the first
  // request to hit a cold server.
  useEffect(() => {
    void warmUpApi();
  }, []);

  const validate = useCallback((): FieldErrors => {
    const next: FieldErrors = {};
    const trimmedEmail = email.trim().toLowerCase();

    if (!gymName.trim()) next.gymName = "Gym or business name is required.";
    else if (gymName.trim().length < 2) next.gymName = "Name must be at least 2 characters.";
    else if (gymName.trim().length > 120) next.gymName = "Name must be 120 characters or fewer.";

    if (!name.trim()) next.name = "Your full name is required.";
    else if (name.trim().length < 2) next.name = "Name must be at least 2 characters.";
    else if (name.trim().length > 100) next.name = "Name must be 100 characters or fewer.";

    if (!trimmedEmail) next.email = "Email is required.";
    else if (!EMAIL_PATTERN.test(trimmedEmail)) next.email = "Enter a valid email address.";

    const phoneDigits = phone.replace(/[^\d]/g, "");
    if (!phone) next.phone = "Mobile number is required.";
    else if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      next.phone = "Enter a valid mobile number (10-15 digits).";
    }

    if (!password) next.password = "Password is required.";
    else if (password.length < 8) next.password = "Password must be at least 8 characters.";
    else if (password.length > 128) next.password = "Password must be 128 characters or fewer.";

    if (!confirm) next.confirm = "Please confirm your password.";
    else if (confirm !== password) next.confirm = "Passwords do not match.";

    if (!acceptedTerms) next.terms = "Please accept the Terms of Service and Privacy Policy.";

    return next;
  }, [acceptedTerms, confirm, email, gymName, name, password, phone]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitting) return;

      const nextErrors = validate();
      setErrors(nextErrors);
      setFormError(null);
      setEmailTaken(false);
      if (Object.keys(nextErrors).length > 0) return;

      const trimmedEmail = email.trim().toLowerCase();

      setSubmitting(true);
      try {
        const result = await signup({
          name: name.trim(),
          email: trimmedEmail,
          phone: phone.trim(),
          password,
        });

        // Keep the gym details until the OTP is confirmed. The verify-email
        // screen reads this stash to create the gym immediately afterwards.
        savePendingSignup({
          email: trimmedEmail,
          gymName: gymName.trim(),
          gymPhone: phone.trim() || undefined,
          gymAddress: address.trim() || undefined,
        });

        // `requiresEmailVerification` means the email existed but was never
        // verified; the backend re-sent a code and no duplicate was created.
        onSignupSuccess(
          trimmedEmail,
          result.requiresEmailVerification === true,
          result.emailSent !== false,
        );
      } catch (error) {
        setSubmitting(false);
        if (error instanceof ApiError) {
          const emailConflict =
            error.status === 409 &&
            (error.code === "EMAIL_ALREADY_REGISTERED" ||
              /email/i.test(error.message));
          if (emailConflict) {
            setEmailTaken(true);
            return;
          }
          if (error.code === "TIMEOUT") {
            setFormError(
              "The server took too long to respond. Your account may already be created — submit again to resend the verification code, or try again in a moment.",
            );
            return;
          }
          setFormError(error.message);
          return;
        }
        setFormError("Something went wrong. Please try again.");
      }
    },
    [
      address,
      email,
      gymName,
      name,
      onSignupSuccess,
      password,
      phone,
      submitting,
      validate,
    ],
  );
  

  const fieldClass = (invalid?: string) =>
    `h-10 w-full rounded-lg border bg-auth-input px-3 text-[13.5px] text-auth-ink outline-none transition-colors placeholder:text-auth-faint focus:ring-2 ${
      invalid
        ? "border-danger/60 focus:border-danger focus:ring-danger/15"
        : "border-auth-line focus:border-auth-gold/60 focus:ring-auth-gold/15"
    }`;

  return (

    <div className="space-y-5">
   
      <GoogleSignInButton callbackPath="/auth/callback" />

      <AuthDivider>Or sign up with email</AuthDivider>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <AuthErrorMessage message={formError} />}
        {emailTaken && (
          <AuthErrorMessage
            message="An account with this email already exists."
            hint={
              <span>
                Already training with us?{" "}
                <Link href="/login" className="font-semibold text-auth-gold hover:text-auth-gold-highlight">
                  Sign in instead
                </Link>
  
              </span>
            }
          />
        )}

        <div>
          <label htmlFor="signup-gym" className="mb-1.5 block text-xs font-medium text-auth-muted">
            Gym / business name
          </label>
          <input
            id="signup-gym"
            type="text"
            autoComplete="organization"
            placeholder="Iron Temple Fitness"
            required
            value={gymName}
            onChange={(event) => setGymName(event.target.value)}
            aria-invalid={Boolean(errors.gymName)}
            aria-describedby={errors.gymName ? "signup-gym-error" : undefined}
            className={fieldClass(errors.gymName)}
          />
          {errors.gymName && (
            <p id="signup-gym-error" role="alert" className="mt-1.5 text-xs text-danger">
              {errors.gymName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="signup-name" className="mb-1.5 block text-xs font-medium text-auth-muted">
            Your full name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Alex Rivera"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "signup-name-error" : undefined}
            className={fieldClass(errors.name)}
          />
          {errors.name && (
            <p id="signup-name-error" role="alert" className="mt-1.5 text-xs text-danger">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="signup-email" className="mb-1.5 block text-xs font-medium text-auth-muted">
            Business email
          </label>
          <input
            id="signup-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@yourgym.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
            className={fieldClass(errors.email)}
          />
          {errors.email && (
            <p id="signup-email-error" role="alert" className="mt-1.5 text-xs text-danger">
              {errors.email}
            </p>
          )}
        </div>

        <PhoneInput
          id="signup-phone"
          label="Mobile number"
          required
          onValueChange={setPhone}
          error={errors.phone}
        />

        <div>
          <label htmlFor="signup-password" className="mb-1.5 block text-xs font-medium text-auth-muted">
            Password
          </label>
          <PasswordInput
            id="signup-password"
            name="new-password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "signup-password-error" : undefined}
            className="h-10"
          />
          <PasswordStrengthIndicator password={password} className="mt-2" />
          {errors.password && (
            <p id="signup-password-error" role="alert" className="mt-1.5 text-xs text-danger">
              {errors.password}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="signup-confirm" className="mb-1.5 block text-xs font-medium text-auth-muted">
            Confirm password
          </label>
          <PasswordInput
            id="signup-confirm"
            name="confirm-password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            required
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            aria-invalid={Boolean(errors.confirm)}
            aria-describedby={errors.confirm ? "signup-confirm-error" : undefined}
            className="h-10"
          />
          {errors.confirm && (
            <p id="signup-confirm-error" role="alert" className="mt-1.5 text-xs text-danger">
              {errors.confirm}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="signup-address" className="mb-1.5 block text-xs font-medium text-auth-muted">
            Gym address <span className="text-auth-faint">(optional)</span>
          </label>
          <input
            id="signup-address"
            type="text"
            autoComplete="street-address"
            placeholder="12 Strength Street, Mumbai"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className={fieldClass()}
          />
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-auth-muted">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              aria-invalid={Boolean(errors.terms)}
              aria-describedby={errors.terms ? "signup-terms-error" : undefined}
              className="mt-0.5 size-4 shrink-0 rounded border-auth-line-strong bg-auth-input accent-auth-gold"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="font-medium text-auth-gold hover:text-auth-gold-highlight">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-medium text-auth-gold hover:text-auth-gold-highlight">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.terms && (
            <p id="signup-terms-error" role="alert" className="mt-1.5 text-xs text-danger">
              {errors.terms}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="gold-surface flex h-10 w-full items-center justify-center rounded-lg px-4 text-[13.5px] font-semibold text-[#1A1503] shadow-auth-gold transition-[filter] hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="text-center text-[13px] text-auth-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-auth-gold transition-colors hover:text-auth-gold-highlight">
          Sign in
        </Link>
      </p>
    </div>
  );
}