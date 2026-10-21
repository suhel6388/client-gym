"use client";

import { useToastState } from "@/hooks/use-toast";
import { ToastItem } from "./toast-item";

/**
 * The one global toast stack plus the persistent screen-reader announcers.
 *
 * Desktop: top-right, below the app navbar. Mobile: top-center, also below the
 * navbar. Mounted once by `ToastProvider` in the root layout, so notifications
 * survive client-side navigation. `pointer-events-none` on the stack keeps the
 * rest of the page interactive; individual cards opt back in.
 *
 * The live regions are always mounted (even with an empty stack) because a
 * live region must exist before its content changes for reliable announcing.
 */
export function ToastViewport() {
  const { visible } = useToastState();

  // Errors are urgent; everything else waits for a pause in speech.
  const urgent = visible.filter((item) => item.variant === "error");
  const polite = visible.filter((item) => item.variant !== "error");

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="false">
        {polite.map((item) => (
          <p key={`${item.id}-${item.revision}`}>
            {item.title}
            {item.description ? `. ${item.description}` : ""}
          </p>
        ))}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="false">
        {urgent.map((item) => (
          <p key={`${item.id}-${item.revision}`}>
            {item.title}
            {item.description ? `. ${item.description}` : ""}
          </p>
        ))}
      </div>

      {visible.length > 0 && (
        <div
          role="region"
          aria-label="Notifications"
          className="toast-viewport pointer-events-none fixed inset-x-0 top-[4.75rem] z-[200] flex flex-col items-center gap-2 px-4 print:hidden sm:inset-x-auto sm:right-5 sm:items-end sm:px-0"
        >
          {visible.map((item) => (
            <ToastItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
