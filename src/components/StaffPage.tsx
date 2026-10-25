"use client";

import { ShieldAlert, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { isOwnerRole } from "@/lib/staff";
import { useSession } from "./auth/SessionProvider";
import { DashboardCard } from "./DashboardCard";
import { StaffAccountsCard } from "./StaffAccountsCard";
import { Button } from "./ui/Button";

export function StaffPage() {
  const { user } = useSession();
  const router = useRouter();
  const isOwner = isOwnerRole(user?.role);

  if (!isOwner) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <DashboardCard
          title="Owner access required"
          subtitle="Staff account management is restricted"
          icon={ShieldAlert}
        >
          <p className="mt-4 text-sm leading-relaxed text-subtle">
            Only the gym owner can create or remove staff logins. You can still
            use the dashboard, add records, and check members in and out.
          </p>
          <Button
            className="mt-5"
            variant="secondary"
            size="md"
            onClick={() => router.push("/dashboard")}
          >
            Back to dashboard
          </Button>
        </DashboardCard>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="animate-fade-up">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
            <UsersRound className="size-4.5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
              Staff
            </h1>
            <p className="mt-1 text-sm text-subtle">
              Create and manage receptionist logins for your gym.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 lg:mt-8">
        <StaffAccountsCard delay={40} />
      </div>
    </div>
  );
}
