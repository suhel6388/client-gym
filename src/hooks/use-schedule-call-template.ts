"use client";

import { useSyncExternalStore } from "react";
import {
  getScheduleCallTemplate,
  getServerScheduleCallTemplate,
  subscribeToScheduleCallTemplate,
} from "@/lib/schedule-call-whatsapp";

/**
 * Reads the platform owner's schedule-call WhatsApp template and re-renders
 * whenever it is saved in this tab or another one.
 */
export function useScheduleCallTemplate(): string {
  return useSyncExternalStore(
    subscribeToScheduleCallTemplate,
    getScheduleCallTemplate,
    getServerScheduleCallTemplate,
  );
}
