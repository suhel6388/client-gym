"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AuthLoadingState } from "./AuthLoadingState";
import { ApiError } from "@/lib/api";
import { resendOtp } from "@/lib/auth-api";

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
  const [pending, setPending] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setSecondsLeft(cooldownSeconds);
    return () => {
      mountedRef.current = false;
    };
  }, [cooldownSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      if (mountedRef.current) setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const handleResend = useCallback(async () => {
    if (pending || secondsLeft > 0) return;
    setPending(true);
    try {
      await resendOtp(email);
      if (mountedRef.current) {
        setSecondsLeft(cooldownSeconds);
        onStatus?.("A new code was sent to your email.");
      }
    } catch (error) {
      if (mountedRef.current) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Could not resend the code. Check your connection and try again.";
        // A rate-limited resend restarts the cooldown.
        if (error instanceof ApiError && error.status === 429) setSecondsLeft(cooldownSeconds);
        onError?.(message);
      }
    } finally {
      if (mountedRef.current) setPending(false);
    }
  }, [cooldownSeconds, email, onError, onStatus, pending, secondsLeft]);

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
          disabled={pending || disabled}
          aria-busy={pending}
          className="font-semibold text-auth-gold underline-offset-4 transition-colors hover:text-auth-gold-highlight hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? <AuthLoadingState label="Sending…" /> : "Resend OTP"}
        </button>
      )}
    </p>
  );
}
