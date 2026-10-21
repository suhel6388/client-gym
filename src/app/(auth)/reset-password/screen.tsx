"use client";

import { Suspense, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSubmitHandler, useFormHandler } from "next-form-handler";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { useToast } from "@/components/providers/ToastProvider";
import { resetPasswordAction } from "@/lib/auth-actions";

function ResetPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const toast = useToast();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // next-form-handler runs the API call through a React action: `isPending`
  // replaces the old manual "submitting" state.
  const { formAction, isPending } = useFormHandler(
    resetPasswordAction,
    () => {
      setDone(true);
      toast.success(
        "Password updated",
        "Sign in with your new password.",
        { dedupeKey: "password-updated" },
      );
      window.setTimeout(() => router.replace("/login"), 2200);
    },
    (state) => setFormError(state.error),
  );
  // Sends a plain object as FormData, inside a React transition.
  const submit = useMemo(() => createSubmitHandler(formAction), [formAction]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    const nextErrors: { password?: string; confirm?: string } = {};
    if (!password) nextErrors.password = "New password is required.";
    else if (password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
    else if (password.length > 128) nextErrors.password = "Password must be 128 characters or fewer.";
    if (!confirm) nextErrors.confirm = "Please confirm your new password.";
    else if (confirm !== password) nextErrors.confirm = "Passwords do not match.";
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    submit({ token, password });
  };

  if (!token) {
    return (
      <AuthCard heading="Reset Your Password" subtitle="Set a new password for your account.">
        <AuthErrorMessage
          message="This reset link is missing its token."
          hint="Request a new link from the forgot-password page."
        />
        <Link
          href="/forgot-password"
          className="gold-surface mt-5 flex h-10 w-full items-center justify-center rounded-lg px-4 text-[13.5px] font-semibold text-[#1A1503] transition-[filter] hover:brightness-110"
        >
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard heading="Reset Your Password" subtitle="Choose a strong password you don't use elsewhere.">
      {done ? (
        <div className="space-y-5">
          <div
            role="status"
            className="rounded-lg border border-success/30 bg-success/[0.06] px-4 py-3.5 text-center"
          >
            <p className="text-[13px] font-medium text-auth-ink">Password updated</p>
            <p className="mt-1 text-xs text-auth-muted">Taking you to the sign-in page…</p>
          </div>
          <Link
            href="/login"
            className="flex h-10 w-full items-center justify-center rounded-lg border border-auth-line-strong text-[13.5px] font-semibold text-auth-ink transition-colors hover:border-auth-gold/40"
          >
            Sign in now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && <AuthErrorMessage message={formError} />}

          <div>
            <label htmlFor="reset-password" className="mb-1.5 block text-xs font-medium text-auth-muted">
              New password
            </label>
            <PasswordInput
              id="reset-password"
              name="new-password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "reset-password-error" : undefined}
              className="h-10"
            />
            <PasswordStrengthIndicator password={password} className="mt-2" />
            {errors.password && (
              <p id="reset-password-error" role="alert" className="mt-1.5 text-xs text-danger">
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="reset-confirm" className="mb-1.5 block text-xs font-medium text-auth-muted">
              Confirm new password
            </label>
            <PasswordInput
              id="reset-confirm"
              name="confirm-password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              aria-invalid={Boolean(errors.confirm)}
              aria-describedby={errors.confirm ? "reset-confirm-error" : undefined}
              className="h-10"
            />
            {errors.confirm && (
              <p id="reset-confirm-error" role="alert" className="mt-1.5 text-xs text-danger">
                {errors.confirm}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            className="gold-surface flex h-10 w-full items-center justify-center rounded-lg px-4 text-[13.5px] font-semibold text-[#1A1503] shadow-auth-gold transition-[filter] hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {isPending ? "Updating…" : "Update Password"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordScreenWithSuspense() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordScreen />
    </Suspense>
  );
}
