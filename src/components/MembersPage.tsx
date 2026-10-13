"use client";

import {
  Download,
  Filter,
  Mail,
  Phone,
  Plus,
  Search,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { members } from "@/lib/members";
import { cn } from "@/lib/cn";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { DashboardCard } from "./DashboardCard";
import { AddMemberDrawer } from "./AddMemberDrawer";

const statusTone = {
  Active: "success" as const,
  Expiring: "warning" as const,
  Inactive: "muted" as const,
  Frozen: "neutral" as const,
};

const planTone = {
  "Annual Pro": "gold" as const,
  "Monthly Flex": "gold" as const,
  Quarterly: "gold" as const,
  Student: "neutral" as const,
};

export function MembersPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const statuses = ["All", "Active", "Expiring", "Inactive", "Frozen"];
  const filteredMembers = members.filter((member) => {
    const matchesQuery = `${member.name} ${member.email} ${member.phone} ${member.plan}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesStatus = statusFilter === "All" || member.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="animate-fade-up">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
            Members
          </h1>
          <p className="mt-1.5 text-sm text-subtle">
            Manage your member roster, memberships, and billing.
          </p>
        </div>
        <div className="animate-fade-up flex flex-wrap gap-2.5" style={{ animationDelay: "80ms" }}>
          <Button variant="secondary" size="md">
            <Download className="size-4" strokeWidth={1.75} aria-hidden />
            Export
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setDrawerOpen(true)}
          >
            <UserPlus className="size-4" strokeWidth={2} aria-hidden />
            Add member
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:mt-8">
        {/* Filters */}
        <DashboardCard
          title="Member directory"
          subtitle={`${filteredMembers.length} of ${members.length} members`}
          icon={UserPlus}
          delay={40}
          action={
            <Button variant="secondary" size="md">
              <Filter className="size-4" strokeWidth={1.75} aria-hidden />
              Filters
            </Button>
          }
        >
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
                strokeWidth={1.75}
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, phone, or plan..."
                className="h-9 w-full rounded-lg border border-line bg-card pr-3 pl-9 text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-gold/50"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "h-8 rounded-lg px-3 text-xs font-medium transition-colors",
                    statusFilter === status
                      ? "gold-surface text-[#1A1503] shadow-gold"
                      : "border border-line bg-card text-subtle hover:bg-card-hover hover:text-ink"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Members table */}
          <div className="mt-5 overflow-x-auto rounded-xl border border-line/80">
            <table className="w-full min-w-[900px] divide-y divide-line/60">
              <thead>
                <tr className="bg-card-hover/40">
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Member
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Contact
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Plan
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Joined
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Next Due
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 bg-card/60">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="transition-colors hover:bg-card-hover/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={member.initials} index={member.id.charCodeAt(member.id.length-1) % 4} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {member.name}
                          </p>
                          <p className="truncate text-xs text-faint">
                            {member.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-subtle">
                          <Mail className="size-3.5" strokeWidth={1.75} aria-hidden />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-subtle">
                          <Phone className="size-3.5" strokeWidth={1.75} aria-hidden />
                          <span className="truncate">{member.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={planTone[member.plan as keyof typeof planTone] || "neutral"}>
                        {member.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone[member.status as keyof typeof statusTone] || "neutral"}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-subtle">
                      {new Date(member.joined).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-subtle">
                      {member.nextDue ? new Date(member.nextDue).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                        <Button variant="secondary" size="sm">
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredMembers.length === 0 && (
            <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-ink">No members found</p>
              <p className="mt-1 text-sm text-subtle">
                Try adjusting your search or filters.
              </p>
              <Button
                variant="primary"
                size="md"
                className="mt-4"
                onClick={() => setDrawerOpen(true)}
              >
                <Plus className="size-4" strokeWidth={2} aria-hidden />
                Add member
              </Button>
            </div>
          )}
        </DashboardCard>
      </div>

      <AddMemberDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
