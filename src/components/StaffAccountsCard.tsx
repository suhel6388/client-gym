"use client";

import {
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  deleteReceptionist,
  listReceptionists,
  type ReceptionistDto,
} from "@/lib/api";
import {
  STAFF_ROLE,
  formatStaffAdded,
  isOwnerRole,
} from "@/lib/staff";
import { useSession } from "./auth/SessionProvider";
import { useToast } from "./providers/ToastProvider";
import { AddStaffDrawer } from "./AddStaffDrawer";
import { ConfirmDialog } from "./ConfirmDialog";
import { DashboardCard } from "./DashboardCard";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "S";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

type LoadStatus = "loading" | "ready" | "error";

/**
 * Owner-only staff management.
 *
 * The component is not rendered for receptionists, and the backend independently
 * enforces `staff:manage` on every `/staff/*` route — hiding the UI is only the
 * first layer.
 */
export function StaffAccountsCard({ delay = 0 }: { delay?: number }) {
  const { user } = useSession();
  const toast = useToast();
  const isOwner = isOwnerRole(user?.role);

  const [staff, setStaff] = useState<ReceptionistDto[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReceptionistDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!isOwner) return;
      if (mode === "initial") {
        setStatus("loading");
        setError(null);
      }
      try {
        const data = await listReceptionists();
        setStaff(data.filter((member) => member.role === STAFF_ROLE));
        setStatus("ready");
        setError(null);
      } catch (caught) {
        setStatus("error");
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Couldn't load staff accounts.",
        );
      }
    },
    [isOwner],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const existingEmails = useMemo(
    () => staff.map((member) => member.email),
    [staff],
  );

  const handleCreated = (created: ReceptionistDto) => {
    setStaff((current) => [
      created,
      ...current.filter((member) => member.id !== created.id),
    ]);
    setStatus("ready");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await toast.promise(deleteReceptionist(deleteTarget.id), {
        loading: {
          title: "Removing staff access…",
          description: `Revoking ${deleteTarget.name}'s dashboard login.`,
        },
        success: {
          title: "Staff access removed",
          description: `${deleteTarget.name} can no longer sign in.`,
        },
        error: (caught) => ({
          title: "Couldn't remove staff access",
          description:
            caught instanceof ApiError
              ? caught.message
              : "Something went wrong. Please try again.",
        }),
      });
      setStaff((current) =>
        current.filter((member) => member.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch {
      // The toast already reported the failure; keep the dialog open so the
      // owner can retry or cancel.
    } finally {
      setDeleting(false);
    }
  };

  // Defence in depth: never mount the owner controls for another role.
  if (!isOwner) return null;

  const staffCount = staff.length;

  return (
    <>
      <DashboardCard
        title="Staff accounts"
        subtitle="Create dashboard logins for your reception team"
        icon={UsersRound}
        delay={delay}
        action={
          <div className="flex items-center gap-2">
            <Badge tone="muted" className="hidden sm:inline-flex">
              Owner only
            </Badge>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setDrawerOpen(true)}
            >
              <Plus className="size-3.5" strokeWidth={2} aria-hidden />
              Add staff
            </Button>
          </div>
        }
      >
        <div className="mt-5 space-y-4">
          <p className="flex items-start gap-2 rounded-lg border border-line/60 bg-card-hover/30 px-3.5 py-3 text-xs leading-relaxed text-faint">
            <ShieldCheck
              className="mt-0.5 size-3.5 shrink-0 text-gold"
              strokeWidth={1.75}
              aria-hidden
            />
            <span>
              Staff can view the dashboard and add records. They cannot edit or
              delete existing records, manage staff, or change billing. Only you
              can create or remove staff logins.
            </span>
          </p>

          {status === "loading" && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-line/70 px-4 py-10 text-sm text-subtle">
              <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden />
              Loading staff accounts…
            </div>
          )}

          {status === "error" && (
            <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-6 text-center">
              <p className="text-sm font-medium text-danger">
                {error ?? "Couldn't load staff accounts."}
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => void load("refresh")}
              >
                <RefreshCw className="size-3.5" strokeWidth={1.75} aria-hidden />
                Try again
              </Button>
            </div>
          )}

          {status === "ready" && staffCount === 0 && (
            <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center">
              <span className="mx-auto inline-flex size-11 items-center justify-center rounded-full bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
                <UsersRound className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <p className="mt-3 text-sm font-medium text-ink">
                No staff accounts yet
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-faint">
                Create a login for your reception desk so they can check members
                in, add members, and view the dashboard.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => setDrawerOpen(true)}
              >
                <Plus className="size-3.5" strokeWidth={2} aria-hidden />
                Create staff login
              </Button>
            </div>
          )}

          {status === "ready" && staffCount > 0 && (
            <div className="overflow-x-auto rounded-xl border border-line/80">
              <table className="w-full min-w-[640px] divide-y divide-line/60">
                <thead>
                  <tr className="bg-card-hover/40">
                    {["Staff member", "Phone", "Role", "Added"].map((label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint"
                      >
                        {label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40 bg-card/60">
                  {staff.map((member, index) => (
                    <tr
                      key={member.id}
                      className="transition-colors hover:bg-card-hover/60"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            initials={initialsFrom(member.name)}
                            index={index}
                            className="size-8 text-[10px]"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">
                              {member.name}
                            </p>
                            <p className="truncate text-xs text-faint">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-subtle">
                        {member.phone || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="gold" dot>
                          Receptionist
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-subtle">
                        {formatStaffAdded(member.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:bg-danger/10 hover:text-danger"
                            aria-label={`Remove ${member.name}`}
                            onClick={() => setDeleteTarget(member)}
                          >
                            <Trash2
                              className="size-3.5"
                              strokeWidth={1.75}
                              aria-hidden
                            />
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardCard>

      <AddStaffDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onCreated={handleCreated}
        existingEmails={existingEmails}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove staff access?"
        description={
          deleteTarget
            ? `${deleteTarget.name} will be signed out and can no longer log in. Their account is deleted; gym records they created stay intact.`
            : undefined
        }
        confirmLabel="Remove access"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />
    </>
  );
}
