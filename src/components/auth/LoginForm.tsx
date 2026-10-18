"use client";

import { useCallback, useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthErrorMessage } from "./AuthErrorMessage";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { PasswordInput } from "./PasswordInput";
import { AuthDivider } from "./AuthDivider";
import { ApiError } from "@/lib/api";
import { login } from "@/lib/auth-api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = { email?: string; password?: string };

type LoginFormProps = {
  /** Sanitized same-app path to return to after signing in. */
  next: string;
  /** Called after the backend confirms credentials and sets the session. */
  onSuccess: (next: string) => void;
  /** Called when the password is right but the email is unverified (403). */
  onUnverified: (email: string) => void;
};

export function LoginForm({ next, onSuccess, onUnverified }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = useCallback((): FieldErrors => {
    const nextErrors: FieldErrors = {};
    if (!email.trim()) nextErrors.email = "Email is required.";
    else if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Password is required.";
    return nextErrors;
  }, [email, password]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitting) return;

      const nextErrors = validate();
      setErrors(nextErrors);
      setFormError(null);
      if (Object.keys(nextErrors).length > 0) return;

      setSubmitting(true);
      try {
        await login({ email: email.trim().toLowerCase(), password, rememberMe });
        onSuccess(next);
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 403) {
            onUnverified(email.trim().toLowerCase());
            return;
          }
          if (error.status === 401) {
            setFormError("Invalid email or password. Check your credentials and try again.");
          } else if (error.status === 0) {
            setFormError("Can't reach the server. Check your connection and try again.");
          } else {
            setFormError(error.message);
          }
        } else {
          setFormError("Something went wrong. Please try again.");
        }
        setSubmitting(false);
      }
      // On success the page redirects, so the button stays disabled.
    },
    [email, next, onSuccess, onUnverified, password, rememberMe, submitting, validate],
  );

  return (
    <div className="space-y-5">
      <GoogleSignInButton callbackPath={`/auth/callback?next=${encodeURIComponent(next)}`} />

      <AuthDivider>Or continue with email</AuthDivider>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <AuthErrorMessage message={formError} />}

        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-auth-muted">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@yourgym.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            className="h-10 w-full rounded-lg border border-auth-line bg-[#0b0b0b] px-3 text-[13.5px] text-auth-ink outline-none transition-colors placeholder:text-auth-faint focus:border-auth-gold/60 focus:ring-2 focus:ring-auth-gold/15"
          />
          {errors.email && (
            <p id="login-email-error" role="alert" className="mt-1.5 text-xs text-danger">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className="text-xs font-medium text-auth-muted">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-auth-gold transition-colors hover:text-auth-gold-highlight"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            className="h-10"
          />
          {errors.password && (
            <p id="login-password-error" role="alert" className="mt-1.5 text-xs text-danger">
              {errors.password}
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-auth-muted">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="size-4 shrink-0 rounded border-auth-line-strong bg-[#0b0b0b] accent-auth-gold"
          />
          Keep me signed in
        </label>

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="gold-surface flex h-10 w-full items-center justify-center rounded-lg px-4 text-[13.5px] font-semibold text-[#1A1503] shadow-auth-gold transition-[filter] hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="text-center text-[13px] text-auth-muted">
        Don&apos;t have an account?{" "}
        <Link
          href={next && next !== "/" ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="font-semibold text-auth-gold transition-colors hover:text-auth-gold-highlight"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
