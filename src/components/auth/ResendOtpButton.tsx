"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSubmitHandler, useFormHandler } from "next-form-handler";
import { AuthLoadingState } from "./AuthLoadingState";
import { useToast } from "@/components/providers/ToastProvider";
import { AUTH_ERRORS, resendOtpAction } from "@/lib/auth-actions";

type ResendOtpButtonProps = {
  email: string;
  /** Called with a friendly message after a successful resend. */
  onStatus?: (message: string) => void;
  /** Called when the resend request fails. */
  onError?: (message: string) => void;
  /** Initial cooldown in seconds (the backend rate-limits resends as well). */
  cooldownSeconds?: number;
  disabled?: boolean;
};

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * "Resend OTP" with a client-side cooldown. The backend remains the source
 * of truth for rate limits — repeated calls there still get rejected.
 */
export function ResendOtpButton({
  email,
  onStatus,
  onError,
  cooldownSeconds = 30,
  disabled = false,
}: ResendOtpButtonProps) {
  const [secondsLeft, setSecondsLeft] = useState(cooldownSeconds);
  const toast = useToast();

  // next-form-handler runs the API call through a React action: `isPending`
  // replaces the old manual "pending" state, and these callbacks decide what
  // to do with the result.
  const { formAction, isPending } = useFormHandler(
    resendOtpAction,
    (state) => {
      setSecondsLeft(cooldownSeconds);
      onStatus?.(state.message ?? "A new code was sent to your email.");
      toast.success(
        "New code sent",
        "Check your inbox — the code expires in 5 minutes.",
        { dedupeKey: "otp-resent" },
      );
    },
    (state) => {
      // A rate-limited resend restarts the cooldown.
      if (state.error === AUTH_ERRORS.rateLimited) setSecondsLeft(cooldownSeconds);
      onError?.(state.error);
    },
  );
  // Sends a plain object as FormData, inside a React transition.
  const submit = useMemo(() => createSubmitHandler(formAction), [formAction]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const handleResend = useCallback(() => {
    if (isPending || secondsLeft > 0) return;
    submit({ email });
  }, [email, isPending, secondsLeft, submit]);

  const waiting = secondsLeft > 0;

  return (
    <p className="text-center text-[13px] text-auth-muted">
      Didn&apos;t get the code?{" "}
      {waiting ? (
        <span className="tabular-nums text-auth-faint" aria-live="polite">
          Resend in {formatCountdown(secondsLeft)}
        </span>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={isPending || disabled}
          aria-busy={isPending}
          className="font-semibold text-auth-gold underline-offset-4 transition-colors hover:text-auth-gold-highlight hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? <AuthLoadingState label="Sending…" /> : "Resend OTP"}
        </button>
      )}
    </p>
  );
}
