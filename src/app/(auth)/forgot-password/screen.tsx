"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createSubmitHandler, useFormHandler } from "next-form-handler";
import { KeyRound, Link2, Mail } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { AuthLoadingState } from "@/components/auth/AuthLoadingState";
import { useToast } from "@/components/providers/ToastProvider";
import { cn } from "@/lib/cn";
import { forgotPasswordAction } from "@/lib/auth-actions";
import type { PasswordResetMethod } from "@/lib/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const METHODS: {
  value: PasswordResetMethod;
  label: string;
  hint: string;
  icon: typeof Link2;
}[] = [
  {
    value: "link",
    label: "Email link",
    hint: "We'll email a secure link to reset your password.",
    icon: Link2,
  },
  {
    value: "otp",
    label: "Email code",
    hint: "We'll email a 6-digit code you can enter on the next screen.",
    icon: KeyRound,
  },
];

/** Step 1: request a reset link or code. Never reveals whether the email exists. */
export default function ForgotPasswordScreen() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<PasswordResetMethod>("link");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sentMethod, setSentMethod] = useState<PasswordResetMethod | null>(null);

  // next-form-handler runs the API call through a React action: `isPending`
  // replaces the old manual "submitting" state.
  const { formAction, isPending } = useFormHandler<{
    method: PasswordResetMethod;
  }>(
    forgotPasswordAction,
    (state) => {
      const delivered = state.data?.method ?? method;
      setSentMethod(delivered);
      toast.success(
        delivered === "otp" ? "Reset code sent" : "Reset link sent",
        delivered === "otp"
          ? "If an account exists for that email, a 6-digit code is on its way."
          : "If an account exists for that email, a reset link is on its way.",
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
    submit({ email: trimmed, method });
  };

  const selected = METHODS.find((item) => item.value === method) ?? METHODS[0];

  if (sentMethod) {
    const resetHref = `/reset-password?method=otp&email=${encodeURIComponent(
      email.trim().toLowerCase(),
    )}`;
    return (
      <AuthCard
        heading="Check Your Inbox"
        subtitle={
          sentMethod === "otp"
            ? "Enter the 6-digit code from your email to choose a new password."
            : "Open the reset link from your email to choose a new password."
        }
      >
        <div className="space-y-5">
          <div
            role="status"
            className="rounded-lg border border-auth-gold/30 bg-auth-gold/[0.06] px-4 py-3.5 text-center"
          >
            <Mail
              className="mx-auto mb-2 size-5 text-auth-gold"
              strokeWidth={1.75}
              aria-hidden
            />
            <p className="text-[13px] font-medium text-auth-ink">
              {sentMethod === "otp" ? "Reset code sent" : "Reset link sent"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-auth-muted">
              If an account exists for{" "}
              <span className="font-semibold text-auth-ink">{email}</span>,{" "}
              {sentMethod === "otp"
                ? "a 6-digit code is on its way. It expires in 5 minutes."
                : "a reset link is on its way. The link expires in 1 hour."}
            </p>
          </div>

          {sentMethod === "otp" && (
            <Link
              href={resetHref}
              className="gold-surface flex h-10 w-full items-center justify-center rounded-lg px-4 text-[13.5px] font-semibold text-[#1A1503] shadow-auth-gold transition-[filter] hover:brightness-110 active:brightness-95"
            >
              Enter reset code
            </Link>
          )}

          <Link
            href="/login"
            className="flex h-10 w-full items-center justify-center rounded-lg border border-auth-line-strong text-[13.5px] font-semibold text-auth-ink transition-colors hover:border-auth-gold/40"
          >
            Back to login
          </Link>

          <button
            type="button"
            onClick={() => {
              setSentMethod(null);
              setFormError(null);
            }}
            className="mx-auto block text-xs font-medium text-auth-muted underline-offset-4 transition-colors hover:text-auth-gold hover:underline"
          >
            Use a different email
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      heading="Reset Your Password"
      subtitle="Choose how you'd like to receive your reset instructions."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <AuthErrorMessage message={formError} />}

        <fieldset className="space-y-2">
          <legend className="mb-1.5 block text-xs font-medium text-auth-muted">
            Delivery method
          </legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {METHODS.map((option) => {
              const Icon = option.icon;
              const active = method === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setMethod(option.value);
                    setFormError(null);
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-colors",
                    active
                      ? "border-auth-gold/60 bg-auth-gold/[0.08] text-auth-gold"
                      : "border-auth-line bg-[#0b0b0b] text-auth-muted hover:border-auth-line-strong hover:text-auth-ink",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] leading-relaxed text-auth-faint">{selected.hint}</p>
        </fieldset>

        <div>
          <label
            htmlFor="forgot-email"
            className="mb-1.5 block text-xs font-medium text-auth-muted"
          >
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
          {isPending ? (
            <AuthLoadingState
              label={method === "otp" ? "Sending code…" : "Sending link…"}
            />
          ) : method === "otp" ? (
            "Send Reset Code"
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-auth-muted">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-semibold text-auth-gold transition-colors hover:text-auth-gold-highlight"
        >
          Back to login
        </Link>
      </p>
    </AuthCard>
  );
}
