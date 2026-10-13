"use client";

import {
  CircleEllipsis,
  Dumbbell,
  Droplets,
  Landmark,
  Megaphone,
  Package,
  SprayCan,
  Users,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Rent: Landmark,
  Electricity: Zap,
  Water: Droplets,
  Equipment: Dumbbell,
  Maintenance: Wrench,
  "Staff Salary": Users,
  Cleaning: SprayCan,
  Marketing: Megaphone,
  Internet: Wifi,
  Supplies: Package,
  Other: CircleEllipsis,
};

export function categoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? CircleEllipsis;
}

/** Neutral category chip with a subtle matching icon. */
export function ExpenseCategoryBadge({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const Icon = categoryIcon(category);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-card-hover/70 px-2 py-0.5 text-[11px] font-medium text-subtle ring-1 ring-inset ring-line",
        className,
      )}
    >
      <Icon className="size-3 shrink-0" strokeWidth={1.75} aria-hidden />
      {category}
    </span>
  );
}
