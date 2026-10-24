"use client";

import {
  Info,
  MessageCircle,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useWhatsAppRenewalTemplate } from "@/hooks/use-whatsapp-template";
import {
  DEFAULT_WHATSAPP_RENEWAL_TEMPLATE,
  MAX_RENEWAL_TEMPLATE_LENGTH,
  RENEWAL_TEMPLATE_PLACEHOLDERS,
  renderRenewalMessage,
  resetWhatsAppRenewalTemplate,
  saveWhatsAppRenewalTemplate,
} from "@/lib/whatsapp";
import { useToast } from "./providers/ToastProvider";
import { Button } from "./ui/Button";
import { DashboardCard } from "./DashboardCard";
import { Label } from "./ui/Label";
import { Textarea } from "./ui/Textarea";

const PREVIEW_CONTEXT = {
  memberName: "Priya Sharma",
  expiryDate: "18 October 2026",
  planName: "Gold Monthly",
  memberCode: "MEM-0102",
};

export function SettingsPage() {
  const toast = useToast();
  const storedTemplate = useWhatsAppRenewalTemplate();
  const [template, setTemplate] = useState(storedTemplate);
  const [hydrated, setHydrated] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // `storedTemplate` starts as the SSR-safe default and switches to the saved
  // value after hydration, or when another tab saves a new template.
  useEffect(() => {
    setTemplate(storedTemplate);
    setHydrated(true);
  }, [storedTemplate]);

  const preview = useMemo(
    () => renderRenewalMessage(template, PREVIEW_CONTEXT),
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
    )}`.slice(0, MAX_RENEWAL_TEMPLATE_LENGTH);

    setTemplate(next);
    requestAnimationFrame(() => {
      element?.focus();
      const cursor = Math.min(start + token.length, next.length);
      element?.setSelectionRange(cursor, cursor);
    });
  };

  const handleSave = () => {
    if (invalid) {
      toast.error("Add a message first", "The reminder message cannot be empty.");
      return;
    }

    if (!saveWhatsAppRenewalTemplate(template)) {
      toast.error(
        "Couldn't save the message",
        "This browser blocked local storage. Enable site storage and try again.",
      );
      return;
    }

    toast.success(
      "Reminder message saved",
      "New WhatsApp reminders will use this message.",
    );
  };

  const handleRestore = () => {
    if (!resetWhatsAppRenewalTemplate()) {
      toast.error(
        "Couldn't restore the default",
        "This browser blocked local storage. Enable site storage and try again.",
      );
      return;
    }

    setTemplate(DEFAULT_WHATSAPP_RENEWAL_TEMPLATE);
    toast.success(
      "Default restored",
      "The original renewal message is back in place.",
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Page header */}
      <div className="animate-fade-up">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-subtle">
          Manage how your gym communicates with members.
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:mt-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        {/* Editor */}
        <DashboardCard
          title="WhatsApp renewal reminders"
          subtitle="Customise the message sent to members with an expired membership"
          icon={MessageCircle}
          delay={40}
        >
          <div className="mt-5 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="renewal-template">Message template</Label>
                <span className="text-[11px] tabular-nums text-faint">
                  {template.length}/{MAX_RENEWAL_TEMPLATE_LENGTH}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-faint">
                This text is prefilled in WhatsApp when you send a renewal
                reminder. Edit it however you like.
              </p>
              <Textarea
                ref={textareaRef}
                id="renewal-template"
                value={template}
                maxLength={MAX_RENEWAL_TEMPLATE_LENGTH}
                rows={5}
                onChange={(event) => setTemplate(event.target.value)}
                aria-invalid={invalid}
                aria-describedby="renewal-template-help"
                className="mt-2 min-h-[150px] resize-y leading-relaxed"
                placeholder={DEFAULT_WHATSAPP_RENEWAL_TEMPLATE}
              />
              <p
                id="renewal-template-help"
                className="mt-1.5 text-[11px] text-faint"
              >
                Use the placeholders below to personalise each message. They
                are replaced automatically for every member.
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
                {RENEWAL_TEMPLATE_PLACEHOLDERS.map((placeholder) => (
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
                disabled={trimmed === DEFAULT_WHATSAPP_RENEWAL_TEMPLATE}
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
                The template is saved in this browser and used by every reminder
                link in the CRM. WhatsApp opens with the message prefilled; you
                still review and press send yourself.
              </span>
            </p>
          </div>
        </DashboardCard>

        <div className="space-y-5">
          {/* Live preview */}
          <DashboardCard
            title="Preview"
            subtitle="What members receive"
            icon={Sparkles}
            delay={80}
          >
            <div className="mt-4 overflow-hidden rounded-xl border border-line/60 bg-[#0b141a]">
              <div className="flex items-center gap-2.5 border-b border-white/5 bg-[#202c33] px-3.5 py-2.5">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                  <MessageCircle
                    className="size-3.5"
                    strokeWidth={2}
                    aria-hidden
                  />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-[#e9edef]">
                    {PREVIEW_CONTEXT.memberName}
                  </p>
                  <p className="truncate text-[10px] text-[#8696a0]">
                    +91 98765 43210
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
          </DashboardCard>

          {/* How it works */}
          <DashboardCard
            title="How it works"
            subtitle="From expired member to renewal nudge"
            icon={Info}
            delay={120}
          >
            <ol className="mt-4 space-y-3 text-[13px] leading-relaxed text-subtle">
              <li className="flex gap-2.5">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-gold/12 text-[10px] font-semibold text-gold ring-1 ring-inset ring-gold/20">
                  1
                </span>
                Open <span className="font-medium text-ink">Members</span> and
                choose the <span className="font-medium text-ink">Expired</span>{" "}
                filter.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-gold/12 text-[10px] font-semibold text-gold ring-1 ring-inset ring-gold/20">
                  2
                </span>
                Tap the green WhatsApp icon on a row, or use{" "}
                <span className="font-medium text-ink">Send reminders</span> to
                see every expired member.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-gold/12 text-[10px] font-semibold text-gold ring-1 ring-inset ring-gold/20">
                  3
                </span>
                Review the prefilled text in WhatsApp and press send. Each
                member gets a message with their own name and expiry date.
              </li>
            </ol>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
