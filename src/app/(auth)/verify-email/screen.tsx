"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { OtpVerificationForm } from "@/components/auth/OtpVerificationForm";
import { useToast } from "@/components/providers/ToastProvider";
import {
  ApiError,
  DASHBOARD_PATH,
  clearPendingSignup,
  fetchCurrentUser,
  maskEmail,
  postAuthDestination,
  readPendingSignup,
  setupGym,
} from "@/lib/api";

function VerifyEmailScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const paramEmail = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const reason = searchParams.get("reason");
  const [email, setEmail] = useState(paramEmail);
  const [missingEmail, setMissingEmail] = useState(false);
  const redirectingRef = useRef(false);

  // Recover the email from the pending-signup stash when arriving without it
  // (e.g. the unverified-login resend path opened in the same tab).
  useEffect(() => {
    if (paramEmail) {
      setEmail(paramEmail);
      setMissingEmail(false);
      return;
    }
    const pending = readPendingSignup();
    if (pending) {
      setEmail(pending.email);
      setMissingEmail(false);
    } else {
      setMissingEmail(true);
    }
  }, [paramEmail]);

  // A user who is already fully signed in has nothing to verify here.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = await fetchCurrentUser();
        if (!active || !current.user.gymId) return;
        redirectingRef.current = true;
        router.replace(postAuthDestination(current.user));
      } catch {
        // Not signed in — expected on this screen.
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  /**
   * Backend-confirmed verification. The session cookie is already set; now
   * finish registration: create the gym (which grants the 14-day trial
   * server-side), then enter the dashboard.
   */
  const handleVerified = useCallback(async () => {
    if (redirectingRef.current) return;
    redirectingRef.current = true;

    toast.success("Email verified", "Finishing your account setup…");

    const pending = readPendingSignup(email);
    if (pending) {
      try {
        await setupGym({
          name: pending.gymName,
          email: pending.email,
          phone: pending.gymPhone,
          address: pending.gymAddress,
        });
        clearPendingSignup();
        router.replace(DASHBOARD_PATH);
        return;
      } catch (err) {
        clearPendingSignup();
        // 409 = the gym already exists for this account; follow the session.
        if (err instanceof ApiError && err.status === 409) {
          try {
            const current = await fetchCurrentUser();
            router.replace(postAuthDestination(current.user));
          } catch {
            router.replace(DASHBOARD_PATH);
          }
          return;
        }
        // The session cookie did not survive verification (wrong API origin,
        // cross-site cookie blocked, ...). Send the user back to sign in.
        if (err instanceof ApiError && err.status === 401) {
          redirectingRef.current = false;
          toast.error(
            "Session expired",
            "Your email is verified, but the session could not be confirmed. Please sign in.",
            { dedupeKey: "verify-session-missing" },
          );
          router.replace("/login");
          return;
        }
        toast.error(
          "Could not finish setting up your gym",
          "Your account is verified — you can create your gym on the next screen.",
          { dedupeKey: "setup-gym-failed" },
        );
        router.replace("/setup-gym");
        return;
      }
    }

    // No pending gym details (e.g. verification after an unverified login):
    // follow whatever the account still needs.
    try {
      const current = await fetchCurrentUser();
      router.replace(postAuthDestination(current.user));
    } catch {
      redirectingRef.current = false;
      router.replace("/login");
    }
  }, [email, router, toast]);

  if (missingEmail) {
    return (
      <AuthCard heading="Verify Your Email" subtitle="Enter the code from your inbox to continue.">
        <AuthErrorMessage
          message="We couldn't find the email address for this verification."
          hint="Restart the sign-up process to request a new code."
        />
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/signup"
            className="gold-surface flex h-10 w-full items-center justify-center rounded-lg px-4 text-[13.5px] font-semibold text-[#1A1503] transition-[filter] hover:brightness-110"
          >
            Back to sign up
          </Link>
          <Link
            href="/login"
            className="flex h-10 w-full items-center justify-center rounded-lg border border-auth-line-strong text-[13.5px] font-semibold text-auth-ink transition-colors hover:border-auth-gold/40"
          >
            Back to login
          </Link>
        </div>
      </AuthCard>
    );
  }

  const subtitle =
    reason === "login"
      ? "Your email isn't verified yet. Enter the code we just sent to continue."
      : reason === "signup-existing"
        ? "This email is already registered but not verified. Enter the new code we sent to continue."
        : reason === "dashboard"
          ? "Verify your email before using your dashboard. Enter the code we sent to continue."
          : "We've sent a verification code to your email address.";

  return (
    <AuthCard heading="Verify Your Email" subtitle={subtitle}>
      <p className="-mt-3 mb-6 text-center text-[13px] text-auth-muted">
        Code sent to{" "}
        <span className="font-semibold text-auth-ink">{email ? maskEmail(email) : "your email"}</span>
      </p>

      <OtpVerificationForm email={email} onSuccess={() => void handleVerified()} />

      <div className="mt-6 border-t border-auth-line pt-5">
        <p className="text-center text-[13px] text-auth-muted">
          Wrong address?{" "}
          <Link href="/signup" className="font-semibold text-auth-gold transition-colors hover:text-auth-gold-highlight">
            Use a different email
          </Link>
        </p>
        <p className="mt-2 text-center text-[13px] text-auth-muted">
          <Link href="/login" className="font-semibold text-auth-gold transition-colors hover:text-auth-gold-highlight">
            Back to login
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailScreenWithSuspense() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailScreen />
    </Suspense>
  );
}
