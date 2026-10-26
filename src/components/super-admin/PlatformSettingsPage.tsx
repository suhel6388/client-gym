"use client";

import {
  CalendarClock,
  Info,
  MessageCircle,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Sparkles,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useScheduleCallTemplate } from "@/hooks/use-schedule-call-template";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { SUPER_ADMIN_PATH } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  DEFAULT_SCHEDULE_CALL_TEMPLATE,
  MAX_SCHEDULE_CALL_TEMPLATE_LENGTH,
  SCHEDULE_CALL_TEMPLATE_PLACEHOLDERS,
  renderScheduleCallMessage,
  resetScheduleCallTemplate,
  saveScheduleCallTemplate,
} from "@/lib/schedule-call-whatsapp";

const CALLS_PATH = `${SUPER_ADMIN_PATH}/schedule-calls`;

const PREVIEW_CONTEXT = {
  clientName: "Rahul Sharma",
  callTime: "27 Oct 2026, 03:30 pm",
  mobile: "+91 98765 43210",
  note: "Interested in the morning batch.",
};

export function PlatformSettingsPage() {
  const toast = useToast();
  const storedTemplate = useScheduleCallTemplate();
  const [template, setTemplate] = useState(storedTemplate);
  const [hydrated, setHydrated] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTemplate(storedTemplate);
    setHydrated(true);
  }, [storedTemplate]);

  const preview = useMemo(
    () => renderScheduleCallMessage(template, PREVIEW_CONTEXT),
    [template],
  );

  const trimmed = template.trim();
  const invalid = trimmed.length === 0;
  const dirty = hydrated && trimmed !== storedTemplate.trim();

  const insertPlaceholder = (token: string) => {
    const element = textareaRef.current;
    const start = element?.selectionStart ?? template.length;
    const end = element?.selectionEnd ?? start;
    const next = `${template.slice(0, start)}${token}${template.slice(
      end,
    )}`.slice(0, MAX_SCHEDULE_CALL_TEMPLATE_LENGTH);

    setTemplate(next);
    requestAnimationFrame(() => {
      element?.focus();
      const cursor = Math.min(start + token.length, next.length);
      element?.setSelectionRange(cursor, cursor);
    });
  };

  const handleSave = () => {
    if (invalid) {
      toast.error("Add a message first", "The WhatsApp message cannot be empty.");
      return;
    }

    if (!saveScheduleCallTemplate(template)) {
      toast.error(
        "Couldn't save the message",
        "This browser blocked local storage. Enable site storage and try again.",
      );
      return;
    }

    toast.success(
      "WhatsApp message saved",
      "New schedule call messages will use this template.",
    );
  };

  const handleRestore = () => {
    if (!resetScheduleCallTemplate()) {
      toast.error(
        "Couldn't restore the default",
        "This browser blocked local storage. Enable site storage and try again.",
      );
      return;
    }

    setTemplate(DEFAULT_SCHEDULE_CALL_TEMPLATE);
    toast.success(
      "Default restored",
      "The original schedule call message is back in place.",
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1300px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
              <Settings2 className="size-4.5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
                Settings
              </h1>
              <p className="mt-1 text-sm text-subtle">
                Customise how the platform team follows up with enquiries.
              </p>
            </div>
          </div>
        </div>

        <Link
          href={CALLS_PATH}
          className="inline-flex h-9.5 items-center gap-2 self-start rounded-lg border border-gold/30 bg-gold/10 px-4 text-sm font-medium text-gold transition-colors hover:bg-gold/15 sm:self-auto"
        >
          <CalendarClock className="size-4" strokeWidth={1.75} aria-hidden />
          Schedule calls
        </Link>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        {/* Editor */}
        <section className="animate-fade-up rounded-2xl border border-line bg-card/60">
          <div className="flex items-start gap-3 border-b border-line/60 px-5 py-4">
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/12 text-[#25D366] ring-1 ring-inset ring-[#25D366]/25">
              <FaWhatsapp className="size-4.5" aria-hidden />
            </span>
            <div>
              <h2 className="text-[14px] font-semibold text-ink">
                Schedule call WhatsApp message
              </h2>
              <p className="mt-0.5 text-[11.5px] text-faint">
                Prefilled when the team taps WhatsApp on an enquiry.
              </p>
            </div>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="schedule-call-template">Message template</Label>
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    template.length >= MAX_SCHEDULE_CALL_TEMPLATE_LENGTH
                      ? "text-gold"
                      : "text-faint",
                  )}
                >
                  {template.length}/{MAX_SCHEDULE_CALL_TEMPLATE_LENGTH}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-faint">
                Edit the message however you like. Placeholders are replaced
                with each customer&apos;s own details.
              </p>
              <Textarea
                ref={textareaRef}
                id="schedule-call-template"
                value={template}
                maxLength={MAX_SCHEDULE_CALL_TEMPLATE_LENGTH}
                rows={6}
                onChange={(event) => setTemplate(event.target.value)}
                aria-invalid={invalid}
                aria-describedby="schedule-call-template-help"
                className="mt-2 min-h-[160px] resize-y leading-relaxed"
                placeholder={DEFAULT_SCHEDULE_CALL_TEMPLATE}
              />
              <p
                id="schedule-call-template-help"
                className="mt-1.5 text-[11px] text-faint"
              >
                WhatsApp opens with the message prefilled; you still review and
                press send yourself.
              </p>
              {invalid && (
                <p role="alert" className="mt-1.5 text-xs text-danger">
                  Add a message before saving.
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-subtle">Placeholders</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SCHEDULE_CALL_TEMPLATE_PLACEHOLDERS.map((placeholder) => (
                  <button
                    key={placeholder.token}
                    type="button"
                    onClick={() => insertPlaceholder(placeholder.token)}
                    title={placeholder.description}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 font-mono text-[11px] text-subtle transition-colors hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
                  >
                    <Plus className="size-3" strokeWidth={2} aria-hidden />
                    {placeholder.token}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-line/60 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={invalid || !dirty}
              >
                <Save className="size-4" strokeWidth={2} aria-hidden />
                Save message
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleRestore}
                disabled={trimmed === DEFAULT_SCHEDULE_CALL_TEMPLATE}
              >
                <RotateCcw className="size-4" strokeWidth={1.75} aria-hidden />
                Restore default
              </Button>
              {dirty && !invalid && (
                <span className="text-xs font-medium text-warning">
                  Unsaved changes
                </span>
              )}
            </div>

            <p className="flex items-start gap-2 rounded-lg border border-line/60 bg-card-hover/30 px-3.5 py-3 text-xs leading-relaxed text-faint">
              <Info
                className="mt-0.5 size-3.5 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              <span>
                This template is saved in this browser and used by every
                schedule call WhatsApp action in the platform console.
              </span>
            </p>
          </div>
        </section>

        <div className="space-y-5">
          {/* Live preview */}
          <section className="animate-fade-up rounded-2xl border border-line bg-card/60">
            <div className="flex items-start gap-3 border-b border-line/60 px-5 py-4">
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
                <Sparkles className="size-4.5" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <h2 className="text-[14px] font-semibold text-ink">Preview</h2>
                <p className="mt-0.5 text-[11.5px] text-faint">
                  What the customer receives.
                </p>
              </div>
            </div>

            <div className="px-5 py-5">
              <div className="overflow-hidden rounded-xl border border-line/60 bg-[#0b141a]">
                <div className="flex items-center gap-2.5 border-b border-white/5 bg-[#202c33] px-3.5 py-2.5">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                    <FaWhatsapp className="size-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-[#e9edef]">
                      {PREVIEW_CONTEXT.clientName}
                    </p>
                    <p className="truncate text-[10px] text-[#8696a0]">
                      {PREVIEW_CONTEXT.mobile}
                    </p>
                  </div>
                </div>
                <div className="px-3.5 py-4">
                  <p className="ml-auto max-w-[94%] whitespace-pre-wrap break-words rounded-lg rounded-tr-none bg-[#005c4b] px-3 py-2 text-[13px] leading-relaxed text-[#e9edef]">
                    {preview}
                  </p>
                  <p className="mt-1.5 text-right text-[10px] text-[#8696a0]">
                    via WhatsApp
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="animate-fade-up rounded-2xl border border-line bg-card/60">
            <div className="flex items-start gap-3 border-b border-line/60 px-5 py-4">
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold/12 text-gold ring-1 ring-inset ring-gold/20">
                <MessageCircle className="size-4.5" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <h2 className="text-[14px] font-semibold text-ink">
                  How it works
                </h2>
                <p className="mt-0.5 text-[11.5px] text-faint">
                  From enquiry to a prefilled WhatsApp chat.
                </p>
              </div>
            </div>

            <ol className="space-y-3 px-5 py-5 text-[13px] leading-relaxed text-subtle">
              {[
                "Open Schedule calls from the platform navigation.",
                "Tap the green WhatsApp icon on an enquiry row.",
                "Review the prefilled message in WhatsApp and press send.",
              ].map((step, index) => (
                <li key={step} className="flex gap-2.5">
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-gold/12 text-[10px] font-semibold text-gold ring-1 ring-inset ring-gold/20">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <div className="border-t border-line/60 px-5 py-3.5">
              <Link
                href={CALLS_PATH}
                className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-gold hover:text-gold-bright"
              >
                Open schedule call enquiries
                <CalendarClock className="size-3.5" strokeWidth={1.75} aria-hidden />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
