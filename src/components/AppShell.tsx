"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        id="app-content"
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-300",
          collapsed ? "lg:pl-20" : "lg:pl-64",
        )}
      >
        <TopNavbar
          onOpenMobile={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((value) => !value)}
          collapsed={collapsed}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}