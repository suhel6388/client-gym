"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
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

  // No session probe on mount: signed-out visitors would trigger an expected
  // 401 on every visit to /login. The session is confirmed after credentials
  // are submitted, and the dashboard guard checks it on protected routes.

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
    (email: string, emailSent: boolean) => {
      toast.warning(
        "Email not verified",
        emailSent
          ? "Enter the 6-digit code we sent to your inbox to continue."
          : "We couldn't send a new code. Tap Resend OTP on the next screen.",
      );
      const delivery = emailSent ? "" : "&emailSent=0";
      router.replace(
        `/verify-email?email=${encodeURIComponent(email)}&reason=login${delivery}`,
      );
    },
    [router, toast],
  );

  return (
    <AuthCard heading="Welcome Back" subtitle="Sign in to manage your gym.">
      <LoginForm next={next} onSuccess={handleSuccess} onUnverified={handleUnverified} />
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
