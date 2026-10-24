import type { MemberStatus } from "./members-api";

export type BadgeTone =
  | "gold"
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "muted";

const STATUS_TONES: Record<MemberStatus, BadgeTone> = {
  Active: "success",
  Expiring: "warning",
  Expired: "danger",
  Inactive: "muted",
  Frozen: "neutral",
};

export function statusTone(status: MemberStatus): BadgeTone {
  return STATUS_TONES[status] ?? "neutral";
}

/** Plans are rendered with the brand gold tone. */
export function planTone(): BadgeTone {
  return "gold";
}
