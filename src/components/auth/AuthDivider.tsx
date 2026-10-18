import { cn } from "@/lib/cn";

/** "OR CONTINUE WITH EMAIL" style separator between OAuth and email forms. */
export function AuthDivider({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} role="separator" aria-orientation="horizontal">
      <span className="h-px flex-1 bg-auth-line" aria-hidden />
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-auth-faint">
        {children}
      </span>
      <span className="h-px flex-1 bg-auth-line" aria-hidden />
    </div>
  );
}
