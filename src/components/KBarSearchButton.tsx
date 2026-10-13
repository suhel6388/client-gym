"use client";

import { useKBar } from "kbar";
import { Search } from "lucide-react";

export function KBarSearchButton() {
  const { query } = useKBar();

  return (
   <button
  type="button"
  onClick={() => query.toggle()}
  className="relative hidden w-60 items-center justify-center md:flex xl:w-72"
>
  <Search
    className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
    strokeWidth={1.75}
    aria-hidden
  />
  <div className="flex h-9 w-full items-center justify-center overflow-hidden whitespace-nowrap rounded-lg border border-line bg-card px-10 text-center text-[13px] text-faint transition-colors hover:border-gold/50">
    <span className="truncate">Search members, payments, plans…</span>
  </div>
  <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-line bg-card-hover px-1.5 py-0.5 font-sans text-[10px] font-medium text-faint">
    ⌘K
  </kbd>
</button>
  );
}

export function KBarSearchButtonMobile() {
  const { query } = useKBar();

  return (
    <button
      type="button"
      aria-label="Search"
      onClick={() => query.toggle()}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-card hover:text-ink md:hidden"
    >
      <Search className="size-4.5" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
