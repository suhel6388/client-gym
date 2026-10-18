"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";
import { fetchCurrentUser } from "@/lib/auth-api";

function SignupScreen() {
  const router = useRouter();

  // Authenticated users never see the signup form.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = await fetchCurrentUser();
        if (!active) return;
        router.replace(current.user.gymId ? "/" : "/setup-gym");
      } catch {
        // Signed out — the form is exactly where they should be.
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <AuthCard heading="Create Your Gym Account" subtitle="Start managing your gym with DarkGoldGym.">
      <SignupForm
        onSignupSuccess={(email) => {
          router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
        }}
      />
    </AuthCard>
  );
}

export default SignupScreen;
