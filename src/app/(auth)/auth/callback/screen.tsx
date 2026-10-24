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
    case "state_mismatch":
    case "please_restart_the_process":
      return "Your sign-in session expired or the browser blocked the sign-in cookie. Please try again.";
    case "invalid_callback":
    case "invalid_redirect_uri":
    case "invalid_callback_url":
    case "invalid_error_callback_url":
      return "Google sign-in is misconfigured. Contact support if this continues.";
    case "email_not_found":
      return "Google didn't share an email address for this account. Use your email and password instead.";
    case "email_not_verified":
      return "Google hasn't verified this email address. Verify it with Google or use your email instead.";
    case "account_already_linked_to_different_user":
      return "This Google account is already linked to another user. Sign in with that account instead.";
    case "unable_to_link_account":
      return "We couldn't link this Google account. Try signing in with your email and password instead.";
    case "no_code":
    case "invalid_code":
    case "unable_to_get_user_info":
      return "Google sign-in didn't complete. Please try again.";
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
          <GoogleSignInButton
            label="Try Google again"
            callbackPath={
              next
                ? `/auth/callback?next=${encodeURIComponent(next)}`
                : "/auth/callback"
            }
          />
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
