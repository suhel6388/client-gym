"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createSubmitHandler, useFormHandler } from "next-form-handler";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { useToast } from "@/components/providers/ToastProvider";
import { forgotPasswordAction } from "@/lib/auth-actions";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Step 1: request a reset link. Never reveals whether the email exists. */
export default function ForgotPasswordScreen() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // next-form-handler runs the API call through a React action: `isPending`
  // replaces the old manual "submitting" state.
  const { formAction, isPending } = useFormHandler(
    forgotPasswordAction,
    () => {
      setSent(true);
      toast.success(
        "Reset link sent",
        "If an account exists for that email, a reset link is on its way.",
        { dedupeKey: "forgot-password-sent" },
      );
    },
    (state) => setFormError(state.error),
  );
  // Sends a plain object as FormData, inside a React transition.
  const submit = useMemo(() => createSubmitHandler(formAction), [formAction]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setEmailError("Email is required.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setEmailError(null);
    setFormError(null);
    submit({ email: trimmed });
  };

  return (
    <AuthCard
      heading="Reset Your Password"
      subtitle="Enter your account email and we'll send you a secure reset link."
    >
      {sent ? (
        <div className="space-y-5">
          <div
            role="status"
            className="rounded-lg border border-auth-gold/30 bg-auth-gold/[0.06] px-4 py-3.5 text-center"
          >
            <p className="text-[13px] font-medium text-auth-ink">Check your inbox</p>
            <p className="mt-1 text-xs leading-relaxed text-auth-muted">
              If an account exists for <span className="font-semibold text-auth-ink">{email}</span>, a
              reset link is on its way. The link expires in 1 hour.
            </p>
          </div>
          <Link
            href="/login"
            className="flex h-10 w-full items-center justify-center rounded-lg border border-auth-line-strong text-[13.5px] font-semibold text-auth-ink transition-colors hover:border-auth-gold/40"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && <AuthErrorMessage message={formError} />}
          <div>
            <label htmlFor="forgot-email" className="mb-1.5 block text-xs font-medium text-auth-muted">
              Email address
            </label>
            <input
              id="forgot-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@yourgym.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "forgot-email-error" : undefined}
              className="h-10 w-full rounded-lg border border-auth-line bg-[#0b0b0b] px-3 text-[13.5px] text-auth-ink outline-none transition-colors placeholder:text-auth-faint focus:border-auth-gold/60 focus:ring-2 focus:ring-auth-gold/15"
            />
            {emailError && (
              <p id="forgot-email-error" role="alert" className="mt-1.5 text-xs text-danger">
                {emailError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            className="gold-surface flex h-10 w-full items-center justify-center rounded-lg px-4 text-[13.5px] font-semibold text-[#1A1503] shadow-auth-gold transition-[filter] hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {isPending ? "Sending link…" : "Send Reset Link"}
          </button>
        </form>
      )}

      {!sent && (
        <p className="mt-5 text-center text-[13px] text-auth-muted">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-auth-gold transition-colors hover:text-auth-gold-highlight">
            Back to login
          </Link>
        </p>
      )}
    </AuthCard>
  );
}
