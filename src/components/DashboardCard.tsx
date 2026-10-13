"use client";

import { EllipsisVertical, type LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useClickOutside } from "@/hooks/use-click-outside";

export type CardMenuItem = {
  label: string;
  icon?: LucideIcon;
  danger?: boolean;
  onSelect?: () => void;
};

export type DashboardCardProps = {
  title: string;
  subtitle?: string;
  /** Rendered as a small gold icon badge next to the title. */
  icon?: LucideIcon;
  /** Custom action rendered on the right side of the header. */
  action?: React.ReactNode;
  /** Menu items for the three-dot action menu. */
  menuItems?: CardMenuItem[];
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Stagger delay for the mount animation. */
  delay?: number;
};

export function DashboardCard({
  title,
  subtitle,
  icon: Icon,
  action,
  menuItems,
  children,
  className,
  bodyClassName,
  delay = 0,
}: DashboardCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setMenuOpen(false));

  return (
    <section
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        "animate-fade-up flex flex-col rounded-card border border-line bg-card p-5 shadow-card transition-colors duration-200 hover:border-line-strong",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <Icon className="size-4.5" strokeWidth={1.75} aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-faint">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {action}
          {menuItems && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-label={`${title} options`}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex size-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-card-hover hover:text-ink"
              >
                <EllipsisVertical className="size-4" aria-hidden />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-9 z-30 w-44 animate-pop overflow-hidden rounded-xl border border-line-strong bg-elevated py-1.5 shadow-pop">
                  {(menuItems ?? []).map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          item.onSelect?.();
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors",
                          item.danger
                            ? "text-danger hover:bg-danger/10"
                            : "text-subtle hover:bg-card-hover hover:text-ink",
                        )}
                      >
                        {ItemIcon && (
                          <ItemIcon className="size-3.5" strokeWidth={1.75} aria-hidden />
                        )}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}