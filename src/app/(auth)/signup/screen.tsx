"use client";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";

function SignupScreen() {
  const router = useRouter();

  return (
    <AuthCard heading="Create Your Gym Account" subtitle="Start managing your gym with DarkGoldGym.">
      <SignupForm
        onSignupSuccess={(email, alreadyRegistered) => {
          const reason = alreadyRegistered ? "signup-existing" : "signup";
          router.replace(
            `/verify-email?email=${encodeURIComponent(email)}&reason=${reason}`,
          );
        }}
      />
    </AuthCard>
  );
}

export default SignupScreen;
