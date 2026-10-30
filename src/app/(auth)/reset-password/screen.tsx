"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSubmitHandler, useFormHandler } from "next-form-handler";
import { CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { AuthLoadingState } from "@/components/auth/AuthLoadingState";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError, forgotPassword, verifyResetToken } from "@/lib/api";
import { AUTH_ERRORS, friendlyError, resetPasswordAction } from "@/lib/auth-actions";

type FieldErrors = { otp?: string; password?: string; confirm?: string };
type VerifyState = "loading" | "valid" | "invalid";

const RESEND_COOLDOWN_SECONDS = 60;

function ResetPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const token = (searchParams.get("token") ?? "").trim();
  const methodParam = searchParams.get("method");
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();
  // A token always means the link flow. Otherwise an email (or an explicit
  // method=otp) selects the code flow.
  const isOtp = methodParam === "otp" || (!token && Boolean(email));

  const [verifyState, setVerifyState] = useState<VerifyState>(
    isOtp ? "valid" : token ? "loading" : "invalid",
  );
  const [verifyError, setVerifyError] = useState<string | null>(
    !isOtp && !token ? "This reset link is missing its token." : null,
  );

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Validate the emailed token before showing the password form so an
  // expired/used link is rejected immediately instead of after submission.
  useEffect(() => {
    if (isOtp) {
      setVerifyState("valid");
      setVerifyError(null);
      return;
    }
    if (!token) {
      setVerifyState("invalid");
      setVerifyError("This reset link is missing its token.");
      return;
    }

    const controller = new AbortController();
    setVerifyState("loading");
    setVerifyError(null);

    verifyResetToken(token, controller.signal)
      .then(() => setVerifyState("valid"))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setVerifyState("invalid");
        setVerifyError(
          error instanceof ApiError
            ? error.message
            : AUTH_ERRORS.resetLinkInvalid,
        );
      });

    return () => controller.abort();
  }, [isOtp, token]);

  // Simple one-second countdown for the resend button.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const { formAction, isPending } = useFormHandler(
    resetPasswordAction,
    () => {
      setDone(true);
      toast.success("Password updated", "Sign in with your new password.", {
        dedupeKey: "password-updated",
      });
      window.setTimeout(() => router.replace("/login"), 2200);
    },
    (state) => setFormError(state.error),
  );
  // Sends a plain object as FormData, inside a React transition.
  const submit = useMemo(() => createSubmitHandler(formAction), [formAction]);

  const handleResend = useCallback(async () => {
    if (!email || resending || cooldown > 0) return;
    setResending(true);
    setFormError(null);
    setResendMessage(null);
    try {
      await forgotPassword(email, "otp");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setResendMessage("A new 6-digit code was sent to your email.");
      toast.success("Code sent", "Check your inbox for the new code.", {
        dedupeKey: "reset-otp-resent",
      });
    } catch (error) {
      setFormError(friendlyError(error));
    } finally {
      setResending(false);
    }
  }, [cooldown, email, resending, toast]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    const nextErrors: FieldErrors = {};
    if (isOtp && !/^\d{6}$/.test(otp.trim())) {
      nextErrors.otp = "Enter the 6-digit code from your email.";
    }
    if (!password) nextErrors.password = "New password is required.";
    else if (password.length < 8)
      nextErrors.password = "Password must be at least 8 characters.";
    else if (password.length > 128)
      nextErrors.password = "Password must be 128 characters or fewer.";
    if (!confirm) nextErrors.confirm = "Please confirm your new password.";
    else if (confirm !== password) nextErrors.confirm = "Passwords do not match.";

    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    if (isOtp) {
      submit({
        method: "otp",
        email,
        otp: otp.trim(),
        password,
      });
    } else {
      submit({ method: "link", token, password });
    }
  };

  // Invalid or missing reset link / email.
  if (verifyState === "invalid" || (isOtp && !email)) {
    return (
      <AuthCard
        heading="Reset Your Password"
        subtitle="Set a new password for your account."
      >
        <AuthErrorMessage
          message={
            isOtp && !email
              ? "We couldn't tell which email this reset code belongs to."
              : verifyError ?? AUTH_ERRORS.resetLinkInvalid
          }
          hint="Request a new reset link or code from the forgot-password page."
        />
        <Link
          href="/forgot-password"
          className="gold-surface mt-5 flex h-10 w-full items-center justify-center rounded-lg px-4 text-[13.5px] font-semibold text-[#1A1503] transition-[filter] hover:brightness-110"
        >
          Request a new reset
        </Link>
        <p className="mt-4 text-center text-[13px] text-auth-muted">
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

  // Verifying the link token.
  if (verifyState === "loading") {
    return (
      <AuthCard
        heading="Reset Your Password"
        subtitle="Checking your reset link…"
      >
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-2.5 rounded-lg border border-auth-line bg-auth-input px-4 py-8 text-[13px] font-medium text-auth-muted"
        >
          <Loader2
            className="size-4 animate-spin motion-reduce:animate-none"
            strokeWidth={2}
            aria-hidden
          />
          Verifying your reset link…
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      heading="Reset Your Password"
      subtitle={
        isOtp
          ? `Enter the 6-digit code sent to ${email} and choose a new password.`
          : "Choose a strong password you don't use elsewhere."
      }
    >
      {done ? (
        <div className="space-y-5">
          <div
            role="status"
            className="rounded-lg border border-success/30 bg-success/[0.06] px-4 py-3.5 text-center"
          >
            <CheckCircle2
              className="mx-auto mb-2 size-5 text-success"
              strokeWidth={2}
              aria-hidden
            />
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

          {isOtp && (
            <div>
              <label
                htmlFor="reset-otp"
                className="mb-1.5 block text-xs font-medium text-auth-muted"
              >
                6-digit code
              </label>
              <input
                id="reset-otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                placeholder="000000"
                required
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                aria-invalid={Boolean(errors.otp)}
                aria-describedby={errors.otp ? "reset-otp-error" : undefined}
                className="h-11 w-full rounded-lg border border-auth-line bg-auth-input px-3 text-center font-mono text-lg tracking-[0.5em] text-auth-ink outline-none transition-colors placeholder:tracking-[0.5em] placeholder:text-auth-faint focus:border-auth-gold/60 focus:ring-2 focus:ring-auth-gold/15"
              />
              {errors.otp && (
                <p id="reset-otp-error" role="alert" className="mt-1.5 text-xs text-danger">
                  {errors.otp}
                </p>
              )}

              <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                <span className="text-auth-faint">
                  {resendMessage ?? "Didn't get the code?"}
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || cooldown > 0}
                  className="inline-flex items-center gap-1.5 font-semibold text-auth-gold transition-colors hover:text-auth-gold-highlight disabled:cursor-not-allowed disabled:text-auth-faint"
                >
                  {resending ? (
                    <>
                      <Loader2
                        className="size-3 animate-spin motion-reduce:animate-none"
                        strokeWidth={2}
                        aria-hidden
                      />
                      Sending…
                    </>
                  ) : cooldown > 0 ? (
                    `Resend in ${cooldown}s`
                  ) : (
                    <>
                      <MailCheck className="size-3.5" strokeWidth={2} aria-hidden />
                      Resend code
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="reset-password"
              className="mb-1.5 block text-xs font-medium text-auth-muted"
            >
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
            <label
              htmlFor="reset-confirm"
              className="mb-1.5 block text-xs font-medium text-auth-muted"
            >
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
            {isPending ? (
              <AuthLoadingState label="Updating…" />
            ) : (
              "Update Password"
            )}
          </button>

          <p className="text-center text-[13px] text-auth-muted">
            Remembered it?{" "}
            <Link
              href="/login"
              className="font-semibold text-auth-gold transition-colors hover:text-auth-gold-highlight"
            >
              Back to login
            </Link>
          </p>
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
