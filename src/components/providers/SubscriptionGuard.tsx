"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/components/auth/SessionProvider";
import { useSubscription } from "@/hooks/useSubscription";
import { LoaderWave } from "@/components/loaders/loaderwave";

/**
 * Client-side guard for the gym management dashboard.
 *
 * Rules:
 *   - Super Admins bypass subscription requirements.
 *   - While subscription status is resolving, displays LoaderWave so the dashboard never flashes.
 *   - If the gym subscription is expired, trialing ended, or non-entitled, redirects to `/upgrade`.
 */
export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status: sessionStatus } = useSession();
  const { loading: subLoading, entitled } = useSubscription();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (sessionStatus === "loading" || subLoading) return;
    if (isSuperAdmin) return;

    // If subscription is resolved and gym is not entitled, send them to upgrade
    if (!entitled) {
      if (!pathname?.startsWith("/upgrade") && !pathname?.startsWith("/subscription")) {
        router.replace("/upgrade");
      }
    }
  }, [sessionStatus, subLoading, entitled, isSuperAdmin, pathname, router]);

  // While determining session or subscription entitlement, show smooth dark loader
  if (sessionStatus === "loading" || (!isSuperAdmin && subLoading)) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black">
        <LoaderWave />
      </div>
    );
  }

  // If not entitled and not a super admin, block dashboard rendering while redirecting
  if (!isSuperAdmin && !entitled && !pathname?.startsWith("/upgrade") && !pathname?.startsWith("/subscription")) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black">
        <LoaderWave />
      </div>
    );
  }

  return <>{children}</>;
}
