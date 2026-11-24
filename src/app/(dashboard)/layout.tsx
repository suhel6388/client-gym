import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { AddMemberEventHandler } from "@/components/AddMemberEventHandler";
import { KBarProviderWrapper } from "@/components/KBarProvider";
import { AuthGuard, SessionProvider } from "@/components/auth/SessionProvider";
import { SubscriptionGuard } from "@/components/providers/SubscriptionGuard";
import { SubscriptionBanner } from "@/components/billing/SubscriptionBanner";

/** Authenticated gym-management area: session guard + subscription entitlement guard + app chrome. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthGuard>
        <SubscriptionGuard>
          <KBarProviderWrapper>
            <SubscriptionBanner />
            <AppShell>{children}</AppShell>
            <AddMemberEventHandler />
          </KBarProviderWrapper>
        </SubscriptionGuard>
      </AuthGuard>
    </SessionProvider>
  );
}
