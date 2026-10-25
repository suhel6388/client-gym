"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { PlatformGymDetailView } from "@/components/super-admin/PlatformGymDetail";
import { SUPER_ADMIN_PATH } from "@/lib/api";

/**
 * Static export cannot prerender an unknown dynamic segment, so the selected
 * gym is passed as `?gymId=...`. `useSearchParams` must live under Suspense.
 */
function Screen() {
  const searchParams = useSearchParams();
  const gymId = searchParams.get("gymId")?.trim() ?? "";

  if (!gymId) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href={`${SUPER_ADMIN_PATH}/gyms`}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-faint transition-colors hover:text-gold"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden />
          All gyms
        </Link>
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-line bg-card/40 px-6 py-14 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold/10 text-gold ring-1 ring-inset ring-gold/20">
            <Building2 className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="mt-4 text-sm font-semibold text-ink">Choose a gym</p>
          <p className="mt-1 max-w-sm text-sm text-subtle">
            Open a gym from the directory to see its subscription and owner details.
          </p>
          <Link
            href={`${SUPER_ADMIN_PATH}/gyms`}
            className="mt-4 inline-flex h-9.5 items-center rounded-lg border border-gold/30 bg-gold/10 px-4 text-sm font-medium text-gold transition-colors hover:bg-gold/15"
          >
            Open gym directory
          </Link>
        </div>
      </div>
    );
  }

  return <PlatformGymDetailView gymId={gymId} />;
}

export function PlatformGymDetailsScreen() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <span
            className="size-7 animate-spin rounded-full border-2 border-line-strong border-t-gold motion-reduce:animate-none"
            aria-label="Loading gym details"
          />
        </div>
      }
    >
      <Screen />
    </Suspense>
  );
}
