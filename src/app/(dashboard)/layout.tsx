import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { AddMemberEventHandler } from "@/components/AddMemberEventHandler";
import { KBarProviderWrapper } from "@/components/KBarProvider";
import { AuthGuard, SessionProvider } from "@/components/auth/SessionProvider";

/** Authenticated gym-management area: session guard + app chrome. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthGuard>
        <KBarProviderWrapper>
          <AppShell>{children}</AppShell>
          <AddMemberEventHandler />
        </KBarProviderWrapper>
      </AuthGuard>
    </SessionProvider>
  );
}
