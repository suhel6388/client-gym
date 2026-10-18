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
import { ApiError } from "@/lib/api";
import { verifyEmailOtp } from "@/lib/auth-api";
import { cn } from "@/lib/cn";

const OTP_LENGTH = 6;

type ErrorKind = "invalid" | "expired" | "locked" | "network" | null;

function mapVerifyError(error: unknown): { message: string; kind: ErrorKind } {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return {
        message: "Can't reach the server. Check your connection and try again.",
        kind: "network",
      };
    }
    const text = error.message.toLowerCase();
    if (text.includes("expired")) {
      return { message: "That code has expired. Request a new one below.", kind: "expired" };
    }
    if (text.includes("too many")) {
      return {
        message: "Too many attempts. Request a new code and try again.",
        kind: "locked",
      };
    }
    return { message: error.message || "Invalid code. Check the 6-digit code and try again.", kind: "invalid" };
  }
  return { message: "Something went wrong. Please try again.", kind: "network" };
}

type OtpVerificationFormProps = {
  email: string;
  /** Called only after the backend confirms verification and sets the session. */
  onSuccess: () => void;
  className?: string;
};

/**
 * Six-box OTP entry: auto-advance, paste-the-whole-code support, Backspace
 * navigation and auto-submit when the code is complete. Success is only ever
 * declared by the backend — the UI never assumes the account is verified.
 */
export function OtpVerificationForm({ email, onSuccess, className }: OtpVerificationFormProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [attemptsLocked, setAttemptsLocked] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const verifyingRef = useRef(false);

  const code = digits.join("");
  const complete = code.length === OTP_LENGTH && /^\d+$/.test(code);

  const focusInput = useCallback((index: number) => {
    inputsRef.current[index]?.focus();
    inputsRef.current[index]?.select();
  }, []);

  const submit = useCallback(
    async (value: string) => {
      if (verifyingRef.current || value.length !== OTP_LENGTH) return;
      verifyingRef.current = true;
      setVerifying(true);
      setError(null);
      setErrorKind(null);
      setStatus(null);
      try {
        await verifyEmailOtp({ email, otp: value });
        onSuccess();
      } catch (err) {
        const mapped = mapVerifyError(err);
        setError(mapped.message);
        setErrorKind(mapped.kind);
        if (mapped.kind === "locked") setAttemptsLocked(true);
        setDigits(Array(OTP_LENGTH).fill(""));
        focusInput(0);
      } finally {
        verifyingRef.current = false;
        setVerifying(false);
      }
    },
    [email, focusInput, onSuccess],
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
      if (verifying) return;
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
    [applyDigits, focusInput, verifying],
  );

  const handleKeyDown = useCallback(
    (index: number, event: KeyboardEvent<HTMLInputElement>) => {
      if (verifying) return;
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
    [focusInput, verifying],
  );

  const handlePaste = useCallback(
    (index: number, event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      if (verifying) return;
      const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
      if (!pasted) return;
      applyDigits(index, pasted.split("").slice(0, OTP_LENGTH));
    },
    [applyDigits, verifying],
  );

  // Auto-submit as soon as all six digits are in — with a tiny delay so the
  // last box paints before the request starts.
  useEffect(() => {
    if (!complete || verifyingRef.current || attemptsLocked) return;
    const timer = window.setTimeout(() => void submit(code), 120);
    return () => window.clearTimeout(timer);
  }, [attemptsLocked, code, complete, submit]);

  const disabled = verifying || attemptsLocked;

  return (
    <div className={cn("space-y-5", className)}>
      <div>
        <div
          role="group"
          aria-label="6-digit verification code"
          className="flex justify-between gap-1.5 sm:gap-2"
          onKeyDown={(event) => {
            if (event.key === "Enter" && complete && !disabled) void submit(code);
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
                "h-12 w-full min-w-0 rounded-lg border bg-[#0b0b0b] text-center text-lg font-semibold tabular-nums text-auth-ink outline-none transition-colors",
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
        onClick={() => void submit(code)}
        disabled={!complete || disabled}
        aria-busy={verifying}
        className="gold-surface flex h-10 w-full items-center justify-center rounded-lg px-4 text-[13.5px] font-semibold text-[#1A1503] shadow-auth-gold transition-[filter] hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {verifying ? "Verifying…" : "Verify Email"}
      </button>

      <ResendOtpButton
        email={email}
        disabled={verifying}
        onStatus={(message) => {
          setStatus(message);
          setError(null);
          setErrorKind(null);
          setAttemptsLocked(false);
          setDigits(Array(OTP_LENGTH).fill(""));
          focusInput(0);
        }}
        onError={(message) => {
          setError(message);
          setErrorKind("network");
        }}
      />
      {errorKind === "expired" && (
        <p className="text-center text-xs text-auth-faint">
          Codes expire 5 minutes after they are sent.
        </p>
      )}
    </div>
  );
}
