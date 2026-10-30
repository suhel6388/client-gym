"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { AuthErrorMessage } from "./AuthErrorMessage";
import { ResendOtpButton } from "./ResendOtpButton";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError, verifyEmailOtp } from "@/lib/api";
import { cn } from "@/lib/cn";

const OTP_LENGTH = 6;

type OtpVerificationFormProps = {
  email: string;
  /** Called only after the backend confirms verification and sets the session. */
  onSuccess: () => void;
  /** Called after a resend succeeds, so the parent can clear a stale warning. */
  onResendSuccess?: () => void;
  className?: string;
};

/**
 * Six-box OTP entry: auto-advance, paste-the-whole-code support, Backspace
 * navigation and auto-submit when the code is complete. Success is only ever
 * declared by the backend — the UI never assumes the account is verified.
 */
export function OtpVerificationForm({
  email,
  onSuccess,
  onResendSuccess,
  className,
}: OtpVerificationFormProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [codeExpired, setCodeExpired] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [attemptsLocked, setAttemptsLocked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  /** One backend attempt per completed code (auto-submit and button share it). */
  const submittedRef = useRef(false);
  const toast = useToast();

  const code = digits.join("");
  const complete = code.length === OTP_LENGTH && /^\d+$/.test(code);

  const focusInput = useCallback((index: number) => {
    inputsRef.current[index]?.focus();
    inputsRef.current[index]?.select();
  }, []);

  const submitCode = useCallback(
    async (value: string) => {
      if (isVerifying || submittedRef.current || value.length !== OTP_LENGTH) return;
      submittedRef.current = true;
      setIsVerifying(true);
      setError(null);
      setCodeExpired(false);
      setStatus(null);
      try {
        await verifyEmailOtp({ email, otp: value });
        onSuccess();
      } catch (requestError) {
        const message =
          requestError instanceof ApiError
            ? requestError.message
            : "Could not verify your email. Please try again.";
        const normalizedMessage = message.toLowerCase();
        const isLocked =
          (requestError instanceof ApiError && requestError.status === 429) ||
          normalizedMessage.includes("too many");
        const isExpired = normalizedMessage.includes("expired");

        setError(message);
        setCodeExpired(isExpired);
        setAttemptsLocked(isLocked);
        if (requestError instanceof ApiError && requestError.status === 0) {
          toast.error(
            "Couldn't reach the server",
            "Check your connection, then try the code again.",
            { dedupeKey: "otp-network" },
          );
        }
        setDigits(Array(OTP_LENGTH).fill(""));
        focusInput(0);
      } finally {
        submittedRef.current = false;
        setIsVerifying(false);
      }
    },
    [email, focusInput, isVerifying, onSuccess, toast],
  );

  const applyDigits = useCallback(
    (start: number, next: string[]) => {
      setDigits((current) => {
        const updated = [...current];
        let index = start;
        for (const char of next) {
          if (index >= OTP_LENGTH) break;
          updated[index] = char;
          index += 1;
        }
        return updated;
      });
      const landing = Math.min(start + next.length, OTP_LENGTH - 1);
      window.setTimeout(() => focusInput(landing), 0);
    },
    [focusInput],
  );

  const handleChange = useCallback(
    (index: number, raw: string) => {
      if (isVerifying) return;
      setStatus(null);
      const chars = raw.replace(/\D/g, "").split("").filter(Boolean);
      if (chars.length === 0) {
        setDigits((current) => {
          const updated = [...current];
          updated[index] = "";
          return updated;
        });
        return;
      }
      if (chars.length === 1) {
        setDigits((current) => {
          const updated = [...current];
          updated[index] = chars[0];
          return updated;
        });
        if (index < OTP_LENGTH - 1) focusInput(index + 1);
        return;
      }
      // Multi-char (autofill or fast typing) — spread from this box.
      applyDigits(index, chars);
    },
    [applyDigits, focusInput, isVerifying],
  );

  const handleKeyDown = useCallback(
    (index: number, event: KeyboardEvent<HTMLInputElement>) => {
      if (isVerifying) return;
      if (event.key === "Backspace") {
        event.preventDefault();
        setDigits((current) => {
          const updated = [...current];
          if (updated[index]) {
            updated[index] = "";
          } else if (index > 0) {
            updated[index - 1] = "";
            window.setTimeout(() => focusInput(index - 1), 0);
          }
          return updated;
        });
      } else if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        focusInput(index - 1);
      } else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
        event.preventDefault();
        focusInput(index + 1);
      }
    },
    [focusInput, isVerifying],
  );

  const handlePaste = useCallback(
    (index: number, event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      if (isVerifying) return;
      const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
      if (!pasted) return;
      applyDigits(index, pasted.split("").slice(0, OTP_LENGTH));
    },
    [applyDigits, isVerifying],
  );

  // Auto-submit as soon as all six digits are in — with a tiny delay so the
  // last box paints before the request starts.
  useEffect(() => {
    if (!complete || attemptsLocked || submittedRef.current) return;
    const timer = window.setTimeout(() => submitCode(code), 120);
    return () => window.clearTimeout(timer);
  }, [attemptsLocked, code, complete, submitCode]);

  const disabled = isVerifying || attemptsLocked;

  return (
    <div className={cn("space-y-5", className)}>
      <div>
        <div
          role="group"
          aria-label="6-digit verification code"
          className="flex justify-between gap-1.5 sm:gap-2"
          onKeyDown={(event) => {
            if (event.key === "Enter" && complete && !disabled) submitCode(code);
          }}
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputsRef.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={OTP_LENGTH}
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
              value={digit}
              disabled={disabled}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={(event) => handlePaste(index, event)}
              onFocus={(event) => event.target.select()}
              className={cn(
                "h-12 w-full min-w-0 rounded-lg border bg-auth-input text-center text-lg font-semibold tabular-nums text-auth-ink outline-none transition-colors",
                "focus:border-auth-gold/70 focus:ring-2 focus:ring-auth-gold/15",
                error ? "border-danger/60" : "border-auth-line",
                disabled && "opacity-60",
              )}
            />
          ))}
        </div>
        {status && (
          <p role="status" className="mt-3 text-center text-[13px] text-success">
            {status}
          </p>
        )}
      </div>

      {error && <AuthErrorMessage message={error} />}

      <button
        type="button"
        onClick={() => submitCode(code)}
        disabled={!complete || disabled}
        aria-busy={isVerifying}
        className="gold-surface flex h-10 w-full items-center justify-center rounded-lg px-4 text-[13.5px] font-semibold text-[#1A1503] shadow-auth-gold transition-[filter] hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {isVerifying ? "Verifying…" : "Verify Email"}
      </button>

      <ResendOtpButton
        email={email}
        disabled={isVerifying}
        onStatus={(message) => {
          setStatus(message);
          setError(null);
          setCodeExpired(false);
          setAttemptsLocked(false);
          submittedRef.current = false;
          setDigits(Array(OTP_LENGTH).fill(""));
          focusInput(0);
          onResendSuccess?.();
        }}
        onError={(message) => {
          setError(message);
          setCodeExpired(false);
        }}
      />
      {codeExpired && (
        <p className="text-center text-xs text-auth-faint">
          Codes expire 5 minutes after they are sent.
        </p>
      )}
    </div>
  );
}
