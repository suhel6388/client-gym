"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { ApiError } from "@/lib/api";
import { forgotPassword } from "@/lib/auth-api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Step 1: request a reset link. Never reveals whether the email exists. */
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

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
    setSubmitting(true);
    try {
      await forgotPassword(trimmed);
      setSent(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 0) {
        setFormError("Can't reach the server. Check your connection and try again.");
      } else {
        setFormError(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
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
            disabled={submitting}
            aria-busy={submitting}
            className="gold-surface flex h-10 w-full items-center justify-center rounded-lg px-4 text-[13.5px] font-semibold text-[#1A1503] shadow-auth-gold transition-[filter] hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? "Sending link…" : "Send Reset Link"}
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
