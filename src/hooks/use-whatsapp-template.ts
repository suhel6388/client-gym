"use client";

import { useSyncExternalStore } from "react";
import {
  getServerWhatsAppRenewalTemplate,
  getWhatsAppRenewalTemplate,
  subscribeToWhatsAppRenewalTemplate,
} from "@/lib/whatsapp";

/**
 * Reads the owner's WhatsApp renewal template and re-renders whenever it is
 * saved in this tab or another one.
 */
export function useWhatsAppRenewalTemplate(): string {
  return useSyncExternalStore(
    subscribeToWhatsAppRenewalTemplate,
    getWhatsAppRenewalTemplate,
    getServerWhatsAppRenewalTemplate,
  );
}
