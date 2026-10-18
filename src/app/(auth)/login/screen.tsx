"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { LoginForm } from "@/components/auth/LoginForm";
import { ApiError } from "@/lib/api";
import { fetchCurrentUser, safeNext } from "@/lib/auth-api";

function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
        router.replace(current.user.gymId ? next : "/setup-gym");
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
      router.replace(target);
    },
    [router],
  );

  const handleUnverified = useCallback(
    (email: string) => {
      router.replace(`/verify-email?email=${encodeURIComponent(email)}&reason=login`);
    },
    [router],
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
