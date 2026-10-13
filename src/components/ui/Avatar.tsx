import { cn } from "@/lib/cn";

const tones = [
  "from-[#E8B84D] to-[#B8862D]",
  "from-[#8A6520] to-[#5C4416]",
  "from-[#3F3F46] to-[#26262A]",
  "from-[#C9A24B] to-[#6B4E18]",
] as const;

export function Avatar({
  initials,
  className,
  index = 0,
}: {
  initials: string;
  className?: string;
  index?: number;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-9 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-semibold tracking-wide text-[#1A1503] ring-1 ring-line",
        tones[index % tones.length],
        className,
      )}
    >
      {initials}
    </span>
  );
}