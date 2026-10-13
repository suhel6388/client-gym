"use client";

import { EllipsisVertical, type LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useClickOutside } from "@/hooks/use-click-outside";

export type ActionMenuItem = {
  label: string;
  icon?: LucideIcon;
  danger?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
};

type ActionMenuProps = {
  items: ActionMenuItem[];
  /** Accessible label for the trigger button. */
  label?: string;
  align?: "left" | "right";
  className?: string;
};

/**
 * Keyboard-accessible three-dot menu shared by plan cards and membership rows.
 * Closes on outside pointer, Escape, and item selection.
 */
export function ActionMenu({
  items,
  label = "More actions",
  align = "right",
  className,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);
  useClickOutside(ref, close, open);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-card-hover hover:text-ink"
      >
        <EllipsisVertical className="size-4" strokeWidth={1.75} aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-9 z-30 w-48 animate-pop overflow-hidden rounded-xl border border-line-strong bg-elevated py-1.5 shadow-pop",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect?.();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-40",
                  item.danger
                    ? "text-danger hover:bg-danger/10"
                    : "text-subtle hover:bg-card-hover hover:text-ink",
                )}
              >
                {ItemIcon && (
                  <ItemIcon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
