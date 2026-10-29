"use client";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";
import { useToast } from "@/components/providers/ToastProvider";

function SignupScreen() {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <AuthCard heading="Create Your Gym Account" subtitle="Start managing your gym with DarkGoldGym.">
      <SignupForm
        onSignupSuccess={(email, alreadyRegistered, emailSent) => {
          const reason = alreadyRegistered ? "signup-existing" : "signup";
          const delivery = emailSent ? "" : "&emailSent=0";
          router.replace(
            `/verify-email?email=${encodeURIComponent(email)}&reason=${reason}${delivery}`,
          );

          if (alreadyRegistered) {
            toast.success(
              emailSent ? "Verification code sent" : "Verification code not sent",
              emailSent
                ? "This email is already registered but not verified. Enter the new code we sent."
                : "We couldn't send a new code. Use Resend code on the next screen.",
              { dedupeKey: "signup-existing" },
            );
          } else {
            toast.success(
              emailSent ? "Account created" : "Account created",
              emailSent
                ? "Enter the 6-digit code sent to your email to verify."
                : "We couldn't send the verification email. Use Resend code on the next screen.",
              { dedupeKey: "signup-created" },
            );
          }
        }}
      />
    </AuthCard>
  );
}

export default SignupScreen;
