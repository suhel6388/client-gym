/**
 * Lightweight cross-component event bus built on top of `window` custom events.
 * Lets the shell (navbar/quick actions) open the member drawer without a shared
 * React ancestor, and lets the members page refresh after a mutation.
 */

import type { MemberDto } from "./members-api";

export const MEMBER_EVENTS = {
  /** Fired to open the drawer in "create" mode. */
  openCreate: "member:open-create",
  /** Fired to open the drawer in "edit" mode. Detail: { member }. */
  openEdit: "member:open-edit",
  /** Fired after a member is created. Detail: { member }. */
  created: "member:created",
  /** Fired after a member is updated. Detail: { member }. */
  updated: "member:updated",
  /** Fired after a member is archived. Detail: { memberId }. */
  archived: "member:archived",
} as const;

function emit(name: string, detail?: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function openCreateMember() {
  emit(MEMBER_EVENTS.openCreate);
}

export function openEditMember(member: MemberDto) {
  emit(MEMBER_EVENTS.openEdit, { member });
}

export function emitMemberCreated(member: unknown) {
  emit(MEMBER_EVENTS.created, { member });
}

export function emitMemberUpdated(member: unknown) {
  emit(MEMBER_EVENTS.updated, { member });
}

export function emitMemberArchived(memberId: string) {
  emit(MEMBER_EVENTS.archived, { memberId });
}

/** Subscribe to one of the `MEMBER_EVENTS`. Returns an unsubscribe function. */
export function onMemberEvent(
  name: (typeof MEMBER_EVENTS)[keyof typeof MEMBER_EVENTS],
  handler: (event: Event) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
}
