/**
 * WhatsApp message template for Super Admin schedule-call enquiries.
 *
 * The CRM never sends WhatsApp messages itself. Actions build a `wa.me` deep
 * link with a prefilled message so the platform owner reviews and sends it
 * from their own WhatsApp account.
 *
 * Like the gym renewal template, this preference is stored per browser in
 * `localStorage` and read through `useScheduleCallTemplate()` so the schedule
 * call table and the settings screen stay in sync without a round-trip.
 */

import type { ScheduleCallDto } from "@/lib/api";
import { formatScheduleCallDateTime } from "@/lib/schedule-call-view";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp";

export const SCHEDULE_CALL_TEMPLATE_STORAGE_KEY =
  "gym-crm:schedule-call-whatsapp-template";

/** Fired after a save so every mounted template surface re-renders. */
const SCHEDULE_CALL_TEMPLATE_EVENT =
  "gym-crm:schedule-call-template-change";

export const MAX_SCHEDULE_CALL_TEMPLATE_LENGTH = 1200;

export const DEFAULT_SCHEDULE_CALL_TEMPLATE =
  "Hi {client_name}, this is DarkGoldGym. You booked a call with us for {call_time}. Please reply here if you need to reschedule.";

export const SCHEDULE_CALL_TEMPLATE_PLACEHOLDERS = [
  {
    token: "{client_name}",
    label: "Customer name",
    description: "The name submitted with the enquiry.",
  },
  {
    token: "{call_time}",
    label: "Call time",
    description: "The scheduled date and time of the call.",
  },
  {
    token: "{mobile}",
    label: "Mobile number",
    description: "The customer's mobile number.",
  },
  {
    token: "{note}",
    label: "Enquiry note",
    description: "The note submitted with the enquiry (may be empty).",
  },
] as const;

export type ScheduleCallMessageContext = {
  clientName: string;
  /** Already formatted for display, e.g. "27 Oct 2026, 03:30 pm". */
  callTime: string;
  mobile?: string | null;
  note?: string | null;
};

type StoredTemplate = {
  scheduleCallTemplate?: unknown;
};

let cachedRaw: string | null = null;
let cachedTemplate = DEFAULT_SCHEDULE_CALL_TEMPLATE;
let cacheLoaded = false;

function normalizeTemplate(value: string): string {
  const trimmed = value.trim();
  return trimmed || DEFAULT_SCHEDULE_CALL_TEMPLATE;
}

function parseStoredTemplate(raw: string | null): string {
  if (!raw) return DEFAULT_SCHEDULE_CALL_TEMPLATE;

  try {
    const parsed = JSON.parse(raw) as StoredTemplate | string;
    const value =
      typeof parsed === "string" ? parsed : parsed?.scheduleCallTemplate;
    return typeof value === "string" && value.trim()
      ? value.trim()
      : DEFAULT_SCHEDULE_CALL_TEMPLATE;
  } catch {
    // A bare/legacy string is still a useful template; anything else falls
    // back to the default rather than breaking every WhatsApp action.
    return raw.trim() || DEFAULT_SCHEDULE_CALL_TEMPLATE;
  }
}

/** Current template. Safe during SSR (returns the default). */
export function getScheduleCallTemplate(): string {
  if (typeof window === "undefined") {
    return DEFAULT_SCHEDULE_CALL_TEMPLATE;
  }

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(SCHEDULE_CALL_TEMPLATE_STORAGE_KEY);
  } catch {
    return DEFAULT_SCHEDULE_CALL_TEMPLATE;
  }

  if (cacheLoaded && raw === cachedRaw) return cachedTemplate;

  cachedRaw = raw;
  cachedTemplate = parseStoredTemplate(raw);
  cacheLoaded = true;
  return cachedTemplate;
}

/** Hydration snapshot: always the default so markup is deterministic. */
export function getServerScheduleCallTemplate(): string {
  return DEFAULT_SCHEDULE_CALL_TEMPLATE;
}

/**
 * Persists the template. Returns false when the browser refused the write
 * (private mode, storage disabled) so Settings can explain it.
 */
export function saveScheduleCallTemplate(value: string): boolean {
  if (typeof window === "undefined") return false;

  const cleaned = normalizeTemplate(value).slice(
    0,
    MAX_SCHEDULE_CALL_TEMPLATE_LENGTH,
  );

  try {
    const raw = JSON.stringify({
      scheduleCallTemplate: cleaned,
      updatedAt: new Date().toISOString(),
    });
    window.localStorage.setItem(SCHEDULE_CALL_TEMPLATE_STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedTemplate = cleaned;
    cacheLoaded = true;
  } catch {
    return false;
  }

  window.dispatchEvent(new Event(SCHEDULE_CALL_TEMPLATE_EVENT));
  return true;
}

/** Restores the shipped default. Returns false when storage is unavailable. */
export function resetScheduleCallTemplate(): boolean {
  return saveScheduleCallTemplate(DEFAULT_SCHEDULE_CALL_TEMPLATE);
}

/** Subscribes to saves from this tab and from other tabs. */
export function subscribeToScheduleCallTemplate(
  listener: () => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key !== SCHEDULE_CALL_TEMPLATE_STORAGE_KEY) return;
    cacheLoaded = false;
    listener();
  };

  const onLocalSave = () => {
    cacheLoaded = false;
    listener();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(SCHEDULE_CALL_TEMPLATE_EVENT, onLocalSave);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SCHEDULE_CALL_TEMPLATE_EVENT, onLocalSave);
  };
}

/** Replaces `{placeholders}` with this enquiry's details. */
export function renderScheduleCallMessage(
  template: string,
  context: ScheduleCallMessageContext,
): string {
  const source = normalizeTemplate(template);
  const values: Record<string, string> = {
    client_name: context.clientName,
    call_time: context.callTime,
    mobile: context.mobile?.trim() ?? "",
    note: context.note?.trim() ?? "",
  };

  return source
    .replace(
      /\{(client_name|call_time|mobile|note)\}/gi,
      (match, token: string) => values[token.toLowerCase()] ?? match,
    )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Builds the WhatsApp deep link for one enquiry. Returns null when the stored
 * mobile number cannot be used, so the UI can explain the failure instead of
 * opening a broken chat.
 */
export function buildScheduleCallWhatsAppUrl(
  call: Pick<
    ScheduleCallDto,
    "clientName" | "Mob" | "callTime" | "note"
  >,
  template = getScheduleCallTemplate(),
): string | null {
  const phone = normalizeWhatsAppPhone(call.Mob);
  if (!phone) return null;

  const message = renderScheduleCallMessage(template, {
    clientName: call.clientName,
    callTime: formatScheduleCallDateTime(call.callTime),
    mobile: call.Mob,
    note: call.note,
  });

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
