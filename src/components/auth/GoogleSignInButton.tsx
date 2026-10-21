"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ApiError, getGoogleSignInUrl } from "@/lib/api";
import { cn } from "@/lib/cn";

/** Official multi-colour Google "G" mark. */
function GoogleGIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.86 11.86 0 0 0 0 12c0 1.94.46 3.77 1.29 5.38l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

type GoogleSignInButtonProps = {
  /** Path to return to after OAuth (must be same-origin; sanitized server-side too). */
  callbackPath?: string;
  label?: string;
  className?: string;
  /** Called when the flow fails before the browser leaves (network/API error). */
  onError?: (message: string) => void;
};

/**
 * "Continue with Google". Asks the backend for the Google consent URL and
 * redirects the browser there — the OAuth code is exchanged server-side and
 * the session cookie is set by the backend. Never fakes a successful login.
 */
export function GoogleSignInButton({
  callbackPath = "/auth/callback",
  label = "Continue with Google",
  className,
  onError,
}: GoogleSignInButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const callbackURL = `${window.location.origin}${callbackPath}`;
      const { url } = await getGoogleSignInUrl(callbackURL);
      if (!url) throw new Error("No authorization URL returned");
      window.location.assign(url);
      // Keep the button in the loading state while the browser navigates away.
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not start Google sign-in. Check your connection and try again.";
      setPending(false);
      setError(message);
      onError?.(message);
    }
  };

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-busy={pending}
        className={cn(
          "flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-auth-line-strong bg-white/[0.03] px-4 text-[13.5px] font-semibold text-auth-ink transition-colors",
          "hover:border-auth-gold/40 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin text-auth-muted motion-reduce:animate-none" strokeWidth={2.25} aria-hidden />
        ) : (
          <GoogleGIcon className="size-4.5" />
        )}
        {pending ? "Redirecting to Google…" : label}
      </button>
      {error && (
        <p role="alert" className="text-center text-xs leading-relaxed text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
