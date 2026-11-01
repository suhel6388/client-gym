"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoaderWave } from "@/components/loaders/loaderwave";
import { useToast } from "@/components/providers/ToastProvider";
import { postAuthDestination, safeNext, type AuthUser } from "@/lib/api";
import { seedSessionUser } from "@/lib/session-cache";

function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const next = safeNext(searchParams.get("next"));
  const [redirecting, setRedirecting] = useState(false);

  // No session probe on mount: signed-out visitors would trigger an expected
  // 401 on every visit to /login. The login response already carries the user,
  // so the guarded dashboard layout can revalidate without blocking this page.

  // Warm the destination route (JS + RSC payload) while the user types, so the
  // post-login `replace` does not wait for the dashboard chunk.
  useEffect(() => {
    router.prefetch(next);
  }, [next, router]);

  const handleSuccess = useCallback(
    (target: string, user?: AuthUser | null) => {
      toast.success("Signed in", "Welcome back to DarkGoldGym.");
      setRedirecting(true);

      if (!user) {
        // Defensive: an older API response without the user payload. Let the
        // destination guard resolve the session instead of guessing.
        router.replace(target);
        return;
      }

      // The login response is authoritative for routing (verified email,
      // platform owner, missing gym). Seed the in-memory snapshot so the
      // dashboard shell paints on the first frame; the guard's `/auth/me`
      // revalidation continues in the background.
      seedSessionUser(user);
      const destination = postAuthDestination(user, target);
      router.prefetch(destination);
      router.replace(destination);
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
    <>
      <AuthCard heading="Welcome Back" subtitle="Sign in to manage your gym.">
        <LoginForm next={next} onSuccess={handleSuccess} onUnverified={handleUnverified} />
      </AuthCard>

      {redirecting && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-auth-canvas/85 px-4 backdrop-blur-sm"
          aria-busy="true"
        >
          <LoaderWave
            size="lg"
            tone="auth"
            label="Opening your dashboard…"
            className="animate-auth-fade-up"
          />
        </div>
      )}
    </>
  );
}

export default function LoginScreenWithSuspense() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}
