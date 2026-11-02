/**
 * Notification event bus for real-time transaction notifications.
 * Persists recent notifications in localStorage and plays notification sound.
 */

import { playNotificationSound } from "./notification-sound";

export type NotificationType =
  | "member_added"
  | "member_updated"
  | "member_archived"
  | "payment_recorded"
  | "expense_added"
  | "expense_updated"
  | "expense_deleted"
  | "membership_assigned"
  | "plan_created"
  | "plan_updated"
  | "attendance_checkin"
  | "attendance_checkout"
  | "receipt_generated";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: number;
  read: boolean;
};

const STORAGE_KEY = "gym_crm_notifications";
const MAX_NOTIFICATIONS = 35;

let notifications: NotificationItem[] = [];
let initialized = false;
const listeners = new Set<() => void>();

function makeId(): string {
  return `notif-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function loadFromStorage(): NotificationItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: NotificationItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_NOTIFICATIONS)));
  } catch {
    // Storage quota or error
  }
}

function initIfNeeded(): void {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    notifications = loadFromStorage();
  }
}

function emit(): void {
  saveToStorage(notifications);
  listeners.forEach((fn) => fn());
}

export function pushNotification(
  type: NotificationType,
  title: string,
  description: string,
): NotificationItem {
  initIfNeeded();

  const item: NotificationItem = {
    id: makeId(),
    type,
    title,
    description,
    timestamp: Date.now(),
    read: false,
  };

  notifications = [item, ...notifications].slice(0, MAX_NOTIFICATIONS);
  emit();

  // Play notification sound
  try {
    playNotificationSound();
  } catch {
    // Silently ignore
  }

  // Also dispatch DOM event for any other subscribers
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("gym:notification", { detail: item }),
    );
  }

  return item;
}

export function markAsRead(id: string): void {
  initIfNeeded();
  notifications = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n,
  );
  emit();
}

export function markAllAsRead(): void {
  initIfNeeded();
  notifications = notifications.map((n) => ({ ...n, read: true }));
  emit();
}

export function clearNotifications(): void {
  initIfNeeded();
  notifications = [];
  emit();
}

export function getNotifications(): NotificationItem[] {
  initIfNeeded();
  return notifications;
}

export function getUnreadCount(): number {
  initIfNeeded();
  return notifications.filter((n) => !n.read).length;
}

export function subscribeNotifications(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Icon and color styles for notification badge */
export function notificationMeta(type: NotificationType): {
  color: string;
  bgColor: string;
  label: string;
} {
  switch (type) {
    case "member_added":
      return { color: "text-emerald-500", bgColor: "bg-emerald-500/10", label: "Member" };
    case "member_updated":
      return { color: "text-blue-500", bgColor: "bg-blue-500/10", label: "Member" };
    case "member_archived":
      return { color: "text-amber-500", bgColor: "bg-amber-500/10", label: "Member" };
    case "payment_recorded":
      return { color: "text-[#e8b84d]", bgColor: "bg-[#e8b84d]/10", label: "Payment" };
    case "expense_added":
    case "expense_updated":
    case "expense_deleted":
      return { color: "text-rose-500", bgColor: "bg-rose-500/10", label: "Expense" };
    case "membership_assigned":
      return { color: "text-[#e8b84d]", bgColor: "bg-[#e8b84d]/10", label: "Membership" };
    case "plan_created":
    case "plan_updated":
      return { color: "text-indigo-500", bgColor: "bg-indigo-500/10", label: "Plan" };
    case "attendance_checkin":
    case "attendance_checkout":
      return { color: "text-teal-500", bgColor: "bg-teal-500/10", label: "Attendance" };
    case "receipt_generated":
      return { color: "text-[#e8b84d]", bgColor: "bg-[#e8b84d]/10", label: "Receipt" };
    default:
      return { color: "text-subtle", bgColor: "bg-card-hover", label: "System" };
  }
}

