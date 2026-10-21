"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthErrorMessage } from "@/components/auth/AuthErrorMessage";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  ApiError,
  fetchCurrentUser,
  postAuthDestination,
} from "@/lib/api";

/** Human-readable messages for the OAuth error codes Better Auth relays back. */
function describeOauthError(code: string | null): string {
  switch ((code ?? "").toLowerCase()) {
    case "":
      return "Google sign-in didn't complete. Please try again.";
    case "access_denied":
    case "user_cancelled":
      return "Google sign-in was cancelled. You can try again or use your email instead.";
    case "invalid_callback":
    case "invalid_redirect_uri":
      return "Google sign-in is misconfigured. Contact support if this continues.";
    default:
      return "Google sign-in failed. Please try again or use your email instead.";
  }
}

function CallbackScreen() {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const next = searchParams.get("next");
  const [message, setMessage] = useState<string | null>(oauthError ? describeOauthError(oauthError) : null);
  const [checking, setChecking] = useState(!oauthError);
  const routedRef = useRef(false);

  // Success path: Better Auth already set the session cookie before sending
  // the browser here. Confirm it server-side, then continue the same
  // onboarding logic as email sign-in.
  useEffect(() => {
    if (oauthError) return;
    let active = true;
    (async () => {
      try {
        const current = await fetchCurrentUser();
        if (!active || routedRef.current) return;
        routedRef.current = true;
        window.location.assign(postAuthDestination(current.user, next));
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          setMessage("Your Google session could not be established. Please try again.");
        } else if (error instanceof ApiError && error.status === 0) {
          setMessage("Can't reach the server. Check your connection and try again.");
        } else {
          setMessage("Google sign-in failed. Please try again or use your email instead.");
        }
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [next, oauthError]);

  return (
    <AuthCard heading="Google Sign-In" subtitle="Completing your secure sign-in…">
      {checking ? (
        <div className="flex flex-col items-center gap-3 py-4" role="status">
          <span
            className="size-7 animate-spin rounded-full border-2 border-auth-line-strong border-t-auth-gold motion-reduce:animate-none"
            aria-hidden
          />
          <p className="text-[13px] text-auth-muted">Verifying your Google account…</p>
        </div>
      ) : (
        <div className="space-y-5">
          <AuthErrorMessage message={message} />
          <GoogleSignInButton label="Try Google again" />
          <Link
            href="/login"
            className="flex h-10 w-full items-center justify-center rounded-lg border border-auth-line-strong text-[13.5px] font-semibold text-auth-ink transition-colors hover:border-auth-gold/40"
          >
            Back to login
          </Link>
        </div>
      )}
    </AuthCard>
  );
}

export default function OAuthCallbackScreenWithSuspense() {
  return (
    <Suspense fallback={null}>
      <CallbackScreen />
    </Suspense>
  );
}
