import type { ReactNode } from "react";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { SuperAdminGuard } from "@/components/super-admin/SuperAdminGuard";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";

/**
 * Authenticated platform-owner area.
 *
 * The session guard rejects gym owners/staff before the shell renders, and the
 * backend independently enforces SUPER_ADMIN on every `/api/v1/super-admin`
 * request.
 */
export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SuperAdminGuard>
        <SuperAdminShell>{children}</SuperAdminShell>
      </SuperAdminGuard>
    </SessionProvider>
  );
}
