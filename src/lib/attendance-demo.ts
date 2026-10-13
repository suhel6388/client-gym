/**
 * In-memory demo store for the Attendance module.
 *
 * WHY THIS EXISTS
 * ---------------
 * The attendance backend does not exist yet (no Prisma model, route, or
 * controller). The Attendance page is therefore built against a clearly
 * labelled demo data source so the UI and business rules can be exercised now.
 *
 * It deliberately reuses the REAL members/memberships returned by the existing
 * members API — only the attendance events themselves are synthesized. Once the
 * backend adds `/attendance` endpoints, flip `NEXT_PUBLIC_USE_REAL_ATTENDANCE_API`
 * and `attendance-api.ts` will use the real service instead of this store.
 *
 * This is NOT finger print verification and does NOT claim device connectivity.
 */

export type DemoAttendanceMethod = "MANUAL" | "FINGERPRINT";
export type DemoAttendanceRecord = {
  id: string;
  memberId: string;
  /** YYYY-MM-DD (local). */
  date: string;
  checkInAt: string;
  checkOutAt: string | null;
  method: DemoAttendanceMethod;
  notes: string | null;
};

const WINDOW_DAYS = 21;

const records: DemoAttendanceRecord[] = [];
let seeded = false;
let sequence = 0;

function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence.toString(36)}-${Date.now().toString(36)}`;
}

/** Stable string hash so generated data is deterministic per member + date. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function atTime(date: Date, hour: number, minute: number): Date {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

/** Seeds attendance for the trailing window. Idempotent. */
export function ensureDemoSeeded(memberIds: string[]) {
  if (seeded) return;
  seeded = true;

  const now = new Date();
  for (let dayOffset = WINDOW_DAYS - 1; dayOffset >= 0; dayOffset -= 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - dayOffset);
    const dateKey = toDateKey(day);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const isToday = dayOffset === 0;

    for (const memberId of memberIds) {
      const chance = isWeekend ? 38 : 66;
      const roll = hash(`${memberId}:${dateKey}`) % 100;
      if (roll >= chance) continue;

      const startHour = 6 + (hash(`${memberId}:${dateKey}:h`) % 5); // 6–10
      const startMinute = hash(`${memberId}:${dateKey}:m`) % 60;
      const checkIn = atTime(day, startHour, startMinute);

      const method: DemoAttendanceMethod =
        hash(`${memberId}:${dateKey}:method`) % 3 === 0 ? "FINGERPRINT" : "MANUAL";

      let checkOut: Date | null = null;
      if (isToday) {
        // Some of today's visitors are still inside.
        if (hash(`${memberId}:${dateKey}:out`) % 2 === 0) {
          const duration = 45 + (hash(`${memberId}:${dateKey}:dur`) % 75);
          checkOut = new Date(checkIn.getTime() + duration * 60_000);
          if (checkOut.getTime() > now.getTime()) checkOut = null;
        }
      } else {
        const duration = 45 + (hash(`${memberId}:${dateKey}:dur`) % 75);
        checkOut = new Date(checkIn.getTime() + duration * 60_000);
      }

      records.push({
        id: nextId("att"),
        memberId,
        date: dateKey,
        checkInAt: checkIn.toISOString(),
        checkOutAt: checkOut ? checkOut.toISOString() : null,
        method,
        notes: null,
      });
    }
  }
}

export function listDemoRecords(): DemoAttendanceRecord[] {
  return records;
}

export function addDemoCheckIn(input: {
  memberId: string;
  date: string;
  time: string;
  notes: string | null;
}): DemoAttendanceRecord {
  const checkInAt = new Date(`${input.date}T${input.time || "00:00"}:00`).toISOString();
  const record: DemoAttendanceRecord = {
    id: nextId("att"),
    memberId: input.memberId,
    date: input.date,
    checkInAt,
    checkOutAt: null,
    method: "MANUAL",
    notes: input.notes,
  };
  records.push(record);
  return record;
}

export function addDemoCheckOut(recordId: string, time: string): DemoAttendanceRecord | null {
  const record = records.find((item) => item.id === recordId);
  if (!record) return null;
  const checkOutAt = new Date(`${record.date}T${time || "00:00"}:00`).toISOString();
  record.checkOutAt = checkOutAt;
  return record;
}

/* -- Biometric (fake device data — integration pending) ------------------- */

export type DemoDeviceStatus = {
  name: string;
  model: string;
  serial: string;
  ipAddress: string;
  firmware: string;
  /** Always offline in demo — no real device is connected. */
  connected: boolean;
  lastSyncAt: string | null;
  enrolledTemplates: number;
  pendingSyncCount: number;
};

export function demoDeviceStatus(memberIds: string[] = []): DemoDeviceStatus {
  const enrollments = memberIds.length ? demoEnrollments(memberIds) : [];
  return {
    name: "Main Entrance Terminal",
    model: "DG-Bio X200",
    serial: "DGX2-8841-0092",
    ipAddress: "192.168.1.64",
    firmware: "1.4.2",
    connected: false,
    lastSyncAt: null,
    enrolledTemplates: enrollments.filter((item) => item.status === "SYNCED").length,
    pendingSyncCount: enrollments.filter((item) => item.status === "PENDING").length,
  };
}

export type DemoEnrollment = {
  id: string;
  memberId: string;
  finger: string;
  templateId: string;
  enrolledAt: string;
  status: "SYNCED" | "PENDING" | "NOT_ENROLLED";
};

const FINGERS = ["Right Thumb", "Right Index", "Left Thumb"];

/** Fake enrollment mappings derived from real members. */
export function demoEnrollments(memberIds: string[]): DemoEnrollment[] {
  return memberIds.map((memberId, index) => {
    const roll = hash(`${memberId}:enroll`) % 3;
    const finger = FINGERS[hash(`${memberId}:finger`) % FINGERS.length];
    const enrolledAt = new Date(Date.now() - (index % 30) * 86_400_000).toISOString();
    return {
      id: `enr-${memberId}`,
      memberId,
      finger,
      templateId: roll === 2 ? "" : `TPL-${(hash(memberId) % 900000 + 100000).toString()}`,
      enrolledAt,
      status: roll === 0 ? "SYNCED" : roll === 1 ? "PENDING" : "NOT_ENROLLED",
    };
  });
}
