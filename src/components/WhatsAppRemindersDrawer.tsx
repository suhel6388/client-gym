"use client";

import {
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Settings2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { formatShortDate } from "@/lib/format";
import type { MemberRow } from "@/lib/members-api";
import { buildWhatsAppRenewalUrl } from "@/lib/whatsapp";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";

type WhatsAppRemindersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Expired members matching the table's current filters. */
  members: MemberRow[];
  /** Current owner template, already resolved from settings. */
  template: string;
};

export function WhatsAppRemindersDrawer({
  open,
  onOpenChange,
  members,
  template,
}: WhatsAppRemindersDrawerProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onOpenChange]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-card shadow-pop transition-transform duration-300 sm:max-w-lg",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-reminders-title"
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line/60 px-6">
          <div className="min-w-0">
            <h2
              id="whatsapp-reminders-title"
              className="text-sm font-semibold text-ink"
            >
              Send renewal reminders
            </h2>
            <p className="mt-0.5 text-xs text-faint">
              {members.length} expired membership
              {members.length === 1 ? "" : "s"} in this view
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-card-hover hover:text-ink"
          >
            <X className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">
          <div className="flex items-start gap-2.5 rounded-xl border border-[#25D366]/20 bg-[#25D366]/[0.06] px-3.5 py-3 text-xs leading-relaxed text-subtle">
            <MessageCircle
              className="mt-0.5 size-4 shrink-0 text-[#25D366]"
              strokeWidth={1.75}
              aria-hidden
            />
            <p>
              Each button opens WhatsApp with your saved message prefilled.
              Review it and press send.{" "}
              <Link
                href="/settings"
                className="font-medium text-gold transition-colors hover:text-gold-bright"
              >
                Customize message
              </Link>
            </p>
          </div>

          {members.length === 0 ? (
            <div className="mt-10 flex flex-col items-center justify-center text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-success/10 text-success ring-1 ring-inset ring-success/20">
                <CheckCircle2
                  className="size-5"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
              <p className="mt-4 text-sm font-semibold text-ink">
                No expired memberships
              </p>
              <p className="mt-1 max-w-xs text-sm text-subtle">
                There is nobody to remind in the current table view.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line/50">
              {members.map((member) => {
                const expiryDate = member.nextDue;
                const url = expiryDate
                  ? buildWhatsAppRenewalUrl(
                      {
                        name: member.name,
                        phone: member.phone,
                        expiryDate,
                        planName: member.plan,
                        memberCode: member.code,
                      },
                      template,
                    )
                  : null;

                return (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 py-3.5 first:pt-2"
                  >
                    <Avatar
                      initials={member.initials}
                      index={member.id.charCodeAt(member.id.length - 1) % 4}
                      className="size-9 text-[10px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {member.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-faint">
                        {member.phone}
                        {expiryDate
                          ? ` · expired ${formatShortDate(
                              expiryDate.slice(0, 10),
                            )}`
                          : ""}
                      </p>
                    </div>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Send WhatsApp renewal reminder to ${member.name}`}
                        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[#25D366]/35 bg-[#25D366]/10 px-3 text-xs font-medium text-[#25D366] transition-colors hover:bg-[#25D366]/15"
                      >
                        <MessageCircle
                          className="size-3.5"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        Send
                        <ExternalLink
                          className="size-3 opacity-70"
                          strokeWidth={2}
                          aria-hidden
                        />
                      </a>
                    ) : (
                      <span
                        className="inline-flex h-8 shrink-0 items-center rounded-lg border border-line/60 bg-card px-3 text-xs text-faint"
                        title="Add a valid phone number to this member to send a reminder"
                      >
                        No valid phone
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line/60 px-6 py-4">
          <Link
            href="/settings"
            className="inline-flex h-9.5 items-center gap-2 rounded-lg px-3 text-sm font-medium text-subtle transition-colors hover:bg-card-hover hover:text-ink"
          >
            <Settings2 className="size-4" strokeWidth={1.75} aria-hidden />
            Message settings
          </Link>
          <Button
            variant="secondary"
            size="md"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </aside>
    </>
  );
}
