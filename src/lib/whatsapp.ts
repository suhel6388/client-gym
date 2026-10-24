/**
 * WhatsApp renewal reminders.
 *
 * The CRM does not send WhatsApp messages itself (that requires the WhatsApp
 * Business API). Instead it builds `wa.me` deep links with a prefilled message,
 * so the owner reviews and sends each message from their own WhatsApp account.
 *
 * The message template is an owner preference. It is stored per browser in
 * `localStorage` and read through `useWhatsAppRenewalTemplate()` so every
 * reminder surface (members table, member drawer, memberships table) stays in
 * sync without a backend round-trip.
 */

import { formatLongDate } from "./format";

export const WHATSAPP_TEMPLATE_STORAGE_KEY =
  "gym-crm:whatsapp-renewal-template";

/** Fired after a save so every mounted reminder surface re-renders. */
const WHATSAPP_TEMPLATE_EVENT = "gym-crm:whatsapp-template-change";

/** Long enough for a personalised message, short enough for a WhatsApp text. */
export const MAX_RENEWAL_TEMPLATE_LENGTH = 1200;

export const DEFAULT_WHATSAPP_RENEWAL_TEMPLATE =
  "Hi {member_name}, your membership expired on {expiry_date}. Please renew your membership to continue your workouts smoothly.";

export const RENEWAL_TEMPLATE_PLACEHOLDERS = [
  {
    token: "{member_name}",
    label: "Member name",
    description: "The member's full name.",
  },
  {
    token: "{expiry_date}",
    label: "Expiry date",
    description: "The date their membership expired.",
  },
  {
    token: "{plan_name}",
    label: "Plan name",
    description: "The membership plan that expired.",
  },
  {
    token: "{member_code}",
    label: "Member code",
    description: "The member's unique code, e.g. MEM-0102.",
  },
] as const;

export type RenewalMessageContext = {
  memberName: string;
  /** Already formatted for display, e.g. "18 October 2026". */
  expiryDate: string;
  planName?: string | null;
  memberCode?: string | null;
};

export type RenewalReminderTarget = {
  name: string;
  phone: string;
  /** Raw ISO date from the membership (`endDate`). */
  expiryDate: string;
  planName?: string | null;
  memberCode?: string | null;
};

type StoredTemplate = {
  renewalTemplate?: unknown;
};

let cachedRaw: string | null = null;
let cachedTemplate = DEFAULT_WHATSAPP_RENEWAL_TEMPLATE;
let cacheLoaded = false;

function normalizeTemplate(value: string): string {
  const trimmed = value.trim();
  return trimmed || DEFAULT_WHATSAPP_RENEWAL_TEMPLATE;
}

function parseStoredTemplate(raw: string | null): string {
  if (!raw) return DEFAULT_WHATSAPP_RENEWAL_TEMPLATE;

  try {
    const parsed = JSON.parse(raw) as StoredTemplate | string;
    const value =
      typeof parsed === "string" ? parsed : parsed?.renewalTemplate;
    return typeof value === "string" && value.trim()
      ? value.trim()
      : DEFAULT_WHATSAPP_RENEWAL_TEMPLATE;
  } catch {
    // A bare/legacy string is still a useful template; anything else falls
    // back to the default rather than breaking every reminder button.
    return raw.trim() || DEFAULT_WHATSAPP_RENEWAL_TEMPLATE;
  }
}

/** Current owner template. Safe during SSR (returns the default). */
export function getWhatsAppRenewalTemplate(): string {
  if (typeof window === "undefined") {
    return DEFAULT_WHATSAPP_RENEWAL_TEMPLATE;
  }

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(WHATSAPP_TEMPLATE_STORAGE_KEY);
  } catch {
    return DEFAULT_WHATSAPP_RENEWAL_TEMPLATE;
  }

  if (cacheLoaded && raw === cachedRaw) return cachedTemplate;

  cachedRaw = raw;
  cachedTemplate = parseStoredTemplate(raw);
  cacheLoaded = true;
  return cachedTemplate;
}

/** Hydration snapshot: always the default so markup is deterministic. */
export function getServerWhatsAppRenewalTemplate(): string {
  return DEFAULT_WHATSAPP_RENEWAL_TEMPLATE;
}

/**
 * Persists the owner's template. Returns false when the browser refused the
 * write (private mode, storage disabled) so Settings can explain it.
 */
export function saveWhatsAppRenewalTemplate(value: string): boolean {
  if (typeof window === "undefined") return false;

  const cleaned = normalizeTemplate(value).slice(0, MAX_RENEWAL_TEMPLATE_LENGTH);

  try {
    const raw = JSON.stringify({
      renewalTemplate: cleaned,
      updatedAt: new Date().toISOString(),
    });
    window.localStorage.setItem(WHATSAPP_TEMPLATE_STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedTemplate = cleaned;
    cacheLoaded = true;
  } catch {
    return false;
  }

  window.dispatchEvent(new Event(WHATSAPP_TEMPLATE_EVENT));
  return true;
}

/** Restores the shipped default. Returns false when storage is unavailable. */
export function resetWhatsAppRenewalTemplate(): boolean {
  return saveWhatsAppRenewalTemplate(DEFAULT_WHATSAPP_RENEWAL_TEMPLATE);
}

/** Subscribes to saves from this tab and from other tabs. */
export function subscribeToWhatsAppRenewalTemplate(
  listener: () => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key !== WHATSAPP_TEMPLATE_STORAGE_KEY) return;
    cacheLoaded = false;
    listener();
  };

  const onLocalSave = () => {
    cacheLoaded = false;
    listener();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(WHATSAPP_TEMPLATE_EVENT, onLocalSave);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(WHATSAPP_TEMPLATE_EVENT, onLocalSave);
  };
}

/** Formats a membership end date for the message body. */
export function formatRenewalExpiryDate(isoDate: string): string {
  const dateKey = isoDate.slice(0, 10);
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return formatLongDate(dateKey);
}

/** Replaces `{placeholders}` in the template with this member's details. */
export function renderRenewalMessage(
  template: string,
  context: RenewalMessageContext,
): string {
  const source = normalizeTemplate(template);
  const values: Record<string, string> = {
    member_name: context.memberName,
    expiry_date: context.expiryDate,
    plan_name: context.planName?.trim() ?? "",
    member_code: context.memberCode?.trim() ?? "",
  };

  return source.replace(
    /\{(member_name|expiry_date|plan_name|member_code)\}/gi,
    (match, token: string) =>
      values[token.toLowerCase()] ?? match,
  );
}

/**
 * Converts a stored phone number to the digits-only international form used by
 * `wa.me`. Local 10-digit numbers are assumed to be Indian (+91), matching the
 * rest of the CRM's INR/India defaults. Returns null when unusable.
 */
export function normalizeWhatsAppPhone(phone: string): string | null {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) digits = digits.slice(2);
  digits = digits.replace(/^0+/, "");
  if (digits.length === 10) digits = `91${digits}`;

  if (digits.length < 11 || digits.length > 15) return null;
  return digits;
}

/**
 * Builds the WhatsApp deep link for one expired membership. Returns null when
 * the member has no usable phone number, so callers can show a helpful state
 * instead of linking to a broken chat.
 */
export function buildWhatsAppRenewalUrl(
  target: RenewalReminderTarget,
  template = getWhatsAppRenewalTemplate(),
): string | null {
  const phone = normalizeWhatsAppPhone(target.phone);
  if (!phone) return null;

  const message = renderRenewalMessage(template, {
    memberName: target.name,
    expiryDate: formatRenewalExpiryDate(target.expiryDate),
    planName: target.planName,
    memberCode: target.memberCode,
  });

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
