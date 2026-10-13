import { cn } from "@/lib/cn";

const tones = {
  gold: {
    badge: "bg-gold/12 text-gold ring-gold/25",
    dot: "bg-gold",
  },
  success: {
    badge: "bg-success/12 text-success ring-success/25",
    dot: "bg-success",
  },
  warning: {
    badge: "bg-warning/12 text-warning ring-warning/25",
    dot: "bg-warning",
  },
  danger: {
    badge: "bg-danger/12 text-danger ring-danger/25",
    dot: "bg-danger",
  },
  neutral: {
    badge: "bg-subtle/10 text-subtle ring-subtle/15",
    dot: "bg-subtle",
  },
  muted: {
    badge: "bg-line/30 text-faint ring-line",
    dot: "bg-faint",
  },
} satisfies Record<string, { badge: string; dot: string }>;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "gold",
  children,
  className,
  dot = false,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4 ring-1 ring-inset",
        tones[tone].badge,
        className,
      )}
    >
      {dot && (
        <span
          className={cn("size-1.5 rounded-full", tones[tone].dot)}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}