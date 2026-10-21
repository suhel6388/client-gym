"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { LoginForm } from "@/components/auth/LoginForm";
import { useToast } from "@/components/providers/ToastProvider";
import {
  ApiError,
  fetchCurrentUser,
  postAuthDestination,
  safeNext,
} from "@/lib/api";

function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const next = safeNext(searchParams.get("next"));
  const [checkingSession, setCheckingSession] = useState(true);
  const [offline, setOffline] = useState(false);

  // Already signed in? Leave the login screen before showing the form.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = await fetchCurrentUser();
        if (!active) return;
        router.replace(postAuthDestination(current.user, next));
      } catch (error) {
        // 401 is the expected "signed out" case; a network failure is worth
        // surfacing so the user knows why nothing is happening.
        if (active && error instanceof ApiError && error.status === 0) setOffline(true);
      } finally {
        if (active) setCheckingSession(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [next, router]);

  const handleSuccess = useCallback(
    (target: string) => {
      toast.success("Signed in", "Welcome back to DarkGoldGym.");
      // Confirm the session cookie with /auth/me before leaving the form, then
      // follow the same redirect rules as OTP verification and Google sign-in.
      void (async () => {
        try {
          const current = await fetchCurrentUser();
          router.replace(postAuthDestination(current.user, target));
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            toast.error(
              "Sign-in could not be confirmed",
              "Your session cookie was not saved. Check the API URL and cookie settings, then try again.",
              { dedupeKey: "login-session-missing" },
            );
            return;
          }
          // Network hiccup after a successful login: let the route guard load
          // the session again instead of trapping the user on the form.
          router.replace(target);
        }
      })();
    },
    [router, toast],
  );

  const handleUnverified = useCallback(
    (email: string) => {
      toast.warning(
        "Email not verified",
        "Enter the 6-digit code we sent to your inbox to continue.",
      );
      router.replace(`/verify-email?email=${encodeURIComponent(email)}&reason=login`);
    },
    [router, toast],
  );

  return (
    <AuthCard heading="Welcome Back" subtitle="Sign in to manage your gym.">
      {offline && (
        <div className="mb-4">
          <AuthErrorMessage message="Can't reach the server. Check your connection and try again." />
        </div>
      )}
      <LoginForm next={next} onSuccess={handleSuccess} onUnverified={handleUnverified} />
      <p className="sr-only" role="status">
        {checkingSession ? "Checking your session" : ""}
      </p>
    </AuthCard>
  );
}

export default function LoginScreenWithSuspense() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}
