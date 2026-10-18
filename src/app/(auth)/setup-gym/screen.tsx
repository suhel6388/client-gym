"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { useToast } from "@/components/providers/ToastProvider";
import { ApiError } from "@/lib/api";
import {
  clearPendingSignup,
  fetchCurrentUser,
  readPendingSignup,
  setupGym,
  type AuthUser,
} from "@/lib/auth-api";

/**
 * Post-signup onboarding: the account exists (email verified, session set)
 * but has no gym yet. Creating the gym also triggers the backend's one-time
 * 14-day free trial — it can never be re-granted by signing in again.
 */
export default function SetupGymScreen() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [gymName, setGymName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = await fetchCurrentUser();
        if (!active) return;
        if (current.user.gymId) {
          router.replace("/");
          return;
        }
        setUser(current.user);
        const pending = readPendingSignup(current.user.email);
        if (pending) {
          setGymName(pending.gymName);
          setPhone(pending.gymPhone ?? "");
          setAddress(pending.gymAddress ?? "");
        }
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login?next=/setup-gym");
          return;
        }
        setFormError(
          error instanceof ApiError
            ? error.message
            : "Something went wrong while loading your account. Please try again.",
        );
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const trimmed = gymName.trim();
    if (trimmed.length < 2) {
      setNameError("Gym or business name is required.");
      return;
    }
    setNameError(null);
    setFormError(null);
    setSubmitting(true);
    try {
      await setupGym({
        name: trimmed,
        email: user?.email,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      clearPendingSignup();
      router.replace("/");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // Gym already attached to this account — nothing left to create.
        clearPendingSignup();
        router.replace("/");
        return;
      }
      toast({
        title: "Could not create your gym",
        description:
          error instanceof ApiError ? error.message : "Check your connection and try again.",
        variant: "error",
      });
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      heading="Set Up Your Gym"
      subtitle="One quick step — your 14-day free trial starts as soon as your gym is created."
    >
      {checking ? (
        <p className="py-6 text-center text-sm text-auth-muted" role="status">
          Loading your account…
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && <AuthErrorMessage message={formError} />}

          {user && (
            <p className="rounded-lg border border-auth-line bg-[#0b0b0b] px-3.5 py-2.5 text-xs text-auth-muted">
              Signed in as <span className="font-semibold text-auth-ink">{user.email}</span>
            </p>
          )}

          <div>
            <label htmlFor="setup-gym-name" className="mb-1.5 block text-xs font-medium text-auth-muted">
              Gym / business name
            </label>
            <input
              id="setup-gym-name"
              type="text"
              autoComplete="organization"
              placeholder="Iron Temple Fitness"
              required
              value={gymName}
              onChange={(event) => setGymName(event.target.value)}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "setup-gym-name-error" : undefined}
              className="h-10 w-full rounded-lg border border-auth-line bg-[#0b0b0b] px-3 text-[13.5px] text-auth-ink outline-none transition-colors placeholder:text-auth-faint focus:border-auth-gold/60 focus:ring-2 focus:ring-auth-gold/15"
            />
            {nameError && (
              <p id="setup-gym-name-error" role="alert" className="mt-1.5 text-xs text-danger">
                {nameError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="setup-gym-phone" className="mb-1.5 block text-xs font-medium text-auth-muted">
              Gym phone <span className="text-auth-faint">(optional)</span>
            </label>
            <input
              id="setup-gym-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-10 w-full rounded-lg border border-auth-line bg-[#0b0b0b] px-3 text-[13.5px] text-auth-ink outline-none transition-colors placeholder:text-auth-faint focus:border-auth-gold/60 focus:ring-2 focus:ring-auth-gold/15"
            />
          </div>

          <div>
            <label htmlFor="setup-gym-address" className="mb-1.5 block text-xs font-medium text-auth-muted">
              Gym address <span className="text-auth-faint">(optional)</span>
            </label>
            <input
              id="setup-gym-address"
              type="text"
              autoComplete="street-address"
              placeholder="12 Strength Street, Mumbai"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="h-10 w-full rounded-lg border border-auth-line bg-[#0b0b0b] px-3 text-[13.5px] text-auth-ink outline-none transition-colors placeholder:text-auth-faint focus:border-auth-gold/60 focus:ring-2 focus:ring-auth-gold/15"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="gold-surface flex h-10 w-full items-center justify-center rounded-lg px-4 text-[13.5px] font-semibold text-[#1A1503] shadow-auth-gold transition-[filter] hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? "Creating gym…" : "Create Gym & Start Trial"}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-[13px] text-auth-muted">
        <Link
          href="/login"
          onClick={() => clearPendingSignup()}
          className="font-semibold text-auth-gold transition-colors hover:text-auth-gold-highlight"
        >
          Use a different account
        </Link>
      </p>
    </AuthCard>
  );
}
