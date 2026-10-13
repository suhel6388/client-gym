"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  useMatches,
  KBarResults,
  Action,
} from "kbar";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  Wallet,
  Dumbbell,
  ChartColumn,
  Settings,
  UserPlus,
} from "lucide-react";

import { openCreateMember } from "@/lib/events";

const RenderResults = () => {
  const { results } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) => {
        if (typeof item === "string") {
          return (
            <div className="px-4 py-2 text-xs uppercase text-faint">
              {item}
            </div>
          );
        }

        return (
          <div
            className={`flex items-center gap-3 px-4 py-2 transition-colors ${
              active ? "bg-card-hover" : "bg-transparent"
            }`}
          >
            {item.icon && <div className="text-subtle">{item.icon}</div>}
            <div className="flex flex-1 flex-col">
              <span className="text-sm text-ink">{item.name}</span>
              {item.subtitle && (
                <span className="text-xs text-faint">{item.subtitle}</span>
              )}
            </div>
            {item.shortcut?.length ? (
              <div className="flex gap-1">
                {item.shortcut.map((sc, idx) => (
                  <kbd
                    key={idx}
                    className="rounded border border-line bg-card px-1.5 py-0.5 text-[10px] font-medium text-faint"
                  >
                    {sc}
                  </kbd>
                ))}
              </div>
            ) : null}
          </div>
        );
      }}
    />
  );
};

export function KBarProviderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const actions = useMemo<Action[]>(
    () => [
      {
        id: "home",
        name: "Go to Dashboard",
        shortcut: ["d"],
        keywords: "dashboard home overview",
        icon: <LayoutDashboard className="size-4" />,
        perform: () => router.push("/"),
      },
      {
        id: "members",
        name: "Go to Members",
        shortcut: ["m"],
        keywords: "members list people",
        icon: <Users className="size-4" />,
        perform: () => router.push("/members"),
      },
      {
        id: "add-member",
        name: "Add New Member",
        shortcut: ["n"],
        keywords: "member new create add",
        icon: <UserPlus className="size-4" />,
        perform: () => openCreateMember(),
      },
      {
        id: "memberships",
        name: "Go to Memberships",
        shortcut: ["s"],
        keywords: "membership memberships plans",
        icon: <CreditCard className="size-4" />,
        perform: () => router.push("/memberships"),
      },
      {
        id: "attendance",
        name: "Go to Attendance",
        shortcut: ["a"],
        keywords: "attendance check-in checkin",
        icon: <CalendarCheck className="size-4" />,
        perform: () => router.push("/attendance"),
      },
      {
        id: "payments",
        name: "Go to Payments",
        shortcut: ["p"],
        keywords: "payments dues revenue",
        icon: <Wallet className="size-4" />,
        perform: () => router.push("/payments"),
      },
      {
        id: "plans",
        name: "Go to Plans & Pricing",
        shortcut: ["pl"],
        keywords: "plans pricing",
        icon: <Dumbbell className="size-4" />,
        perform: () => router.push("/plans"),
      },
      {
        id: "reports",
        name: "Go to Reports",
        shortcut: ["r"],
        keywords: "reports analytics charts",
        icon: <ChartColumn className="size-4" />,
        perform: () => router.push("/reports"),
      },
      {
        id: "settings",
        name: "Go to Settings",
        shortcut: [","],
        keywords: "settings config preferences",
        icon: <Settings className="size-4" />,
        perform: () => router.push("/settings"),
      },
    ],
    [router],
  );

  return (
    <KBarProvider actions={actions}>
      <KBarPortal>
        <KBarPositioner className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm">
          <KBarAnimator className="mx-auto mt-24 w-full max-w-xl overflow-hidden rounded-xl border border-line bg-card shadow-xl">
            <KBarSearch className="w-full border-b border-line bg-transparent px-4 py-3 text-sm text-ink outline-none placeholder:text-faint" />
            <RenderResults />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </KBarProvider>
  );
}
