import {
  checkInMember,
  checkOutMember,
  getAttendanceHistory,
  type AttendanceRecord,
} from "./api";
import {
  addDemoCheckIn,
  addDemoCheckOut,
  demoDeviceStatus,
  demoEnrollments,
  ensureDemoSeeded,
  listDemoRecords,
  type DemoAttendanceMethod,
  type DemoAttendanceRecord,
} from "./attendance-demo";

/* ---------------------------------------------------------------------------
   Attendance service layer
   ---------------------------------------------------------------------------
   The backend attendance module does not exist yet (no Prisma model, route or
   controller). This file defines the contract the UI expects and ships a
   clearly-labelled demo implementation so the page is fully usable today.

   ⚠️ The real routes in API.md are mounted under `/api/v1/attendence`.
   Set `NEXT_PUBLIC_USE_REAL_ATTENDANCE_API=true` to use them:

     GET    /attendence/members/search?q=
     POST   /attendence/check-in
     POST   /attendence/check-out
     GET    /attendence/open/:memberId
     GET    /attendence/members/:memberId/history
     GET    /attendence/summary/today

   Device/enrollment management is not exposed by the API yet, so those
   panels stay in demo mode.
--------------------------------------------------------------------------- */

export type AttendanceMethod = "MANUAL" | "FINGERPRINT" | "DEVICE";
export type AttendanceStatusDto =
  | "PRESENT"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "ABSENT";

export type AttendanceRecordDto = {
  id: string;
  gymId: string;
  memberId: string;
  /** Local calendar day, `YYYY-MM-DD`. */
  date: string;
  checkInAt: string;
  checkOutAt: string | null;
  method: AttendanceMethod;
  status: AttendanceStatusDto;
  notes: string | null;
  createdAt: string;
};

export type AttendanceDeviceDto = {
  name: string;
  model: string;
  serial: string;
  ipAddress: string;
  firmware: string;
  connected: boolean;
  lastSyncAt: string | null;
  enrolledTemplates: number;
  pendingSyncCount: number;
};

export type EnrollmentStatusDto = "SYNCED" | "PENDING" | "NOT_ENROLLED";

export type AttendanceEnrollmentDto = {
  id: string;
  memberId: string;
  finger: string;
  templateId: string;
  enrolledAt: string;
  status: EnrollmentStatusDto;
};

export type CheckInInput = {
  memberId: string;
  /** `YYYY-MM-DD`. */
  date: string;
  /** `HH:mm`. */
  time: string;
  notes?: string | null;
  method?: AttendanceMethod;
};

export type CheckOutInput = {
  recordId: string;
  /** Required by the real API (`POST /attendence/check-out`). */
  memberId?: string;
  /** `HH:mm`. */
  time: string;
  notes?: string | null;
};

export const USE_REAL_ATTENDANCE_API =
  process.env.NEXT_PUBLIC_USE_REAL_ATTENDANCE_API === "true";

export type AttendanceDataSource = "demo" | "api";

/** Which data source is currently serving the page. */
export const ATTENDANCE_DATA_SOURCE: AttendanceDataSource = USE_REAL_ATTENDANCE_API
  ? "api"
  : "demo";

/** Biometric hardware is not wired up in this build. */
export const DEVICE_INTEGRATION_AVAILABLE = false;

const LATENCY_MS = 250;

function wait<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

function toRecordDto(record: DemoAttendanceRecord): AttendanceRecordDto {
  return {
    id: record.id,
    gymId: "demo",
    memberId: record.memberId,
    date: record.date,
    checkInAt: record.checkInAt,
    checkOutAt: record.checkOutAt,
    method: record.method,
    status: record.checkOutAt ? "CHECKED_OUT" : "CHECKED_IN",
    notes: record.notes,
    createdAt: record.checkInAt,
  };
}

/** Maps the documented attendance row (`/attendence`) to the UI model. */
function fromApiRecord(record: AttendanceRecord): AttendanceRecordDto {
  const method: AttendanceMethod =
    record.markingMethod === "QR_CODE"
      ? "DEVICE"
      : record.markingMethod === "BIOMETRIC"
        ? "FINGERPRINT"
        : "MANUAL";

  return {
    id: record.id,
    gymId: "api",
    memberId: record.memberId,
    date: record.attendanceDate.slice(0, 10),
    checkInAt: record.checkInAt,
    checkOutAt: record.checkOutAt,
    method,
    status: record.checkOutAt ? "CHECKED_OUT" : "CHECKED_IN",
    notes: record.checkInNotes ?? record.checkOutNotes ?? null,
    createdAt: record.checkInAt,
  };
}

/**
 * Loads attendance records for a date window.
 *
 * The documented API exposes per-member history rather than one gym-wide list,
 * so the real path reads the newest history for the members currently shown.
 * Demo mode seeds its local store from the same member ids.
 */
export async function listAttendance(
  memberIds: string[],
  params: { from?: string; to?: string } = {},
  signal?: AbortSignal,
): Promise<AttendanceRecordDto[]> {
  if (USE_REAL_ATTENDANCE_API) {
    // Keep the fan-out bounded; the attendance table only renders one day.
    const histories = await Promise.all(
      memberIds.slice(0, 25).map((memberId) =>
        getAttendanceHistory(memberId, { page: 1, limit: 100 }, signal),
      ),
    );
    return histories
      .flatMap((history) => history.data)
      .map(fromApiRecord)
      .filter((record) => !params.from || record.date >= params.from)
      .filter((record) => !params.to || record.date <= params.to)
      .sort((a, b) => b.checkInAt.localeCompare(a.checkInAt));
  }

  ensureDemoSeeded(memberIds);
  const records = listDemoRecords()
    .filter((record) => !params.from || record.date >= params.from)
    .filter((record) => !params.to || record.date <= params.to)
    .sort((a, b) => b.checkInAt.localeCompare(a.checkInAt))
    .map(toRecordDto);
  return wait(records);
}

export async function recordCheckIn(input: CheckInInput): Promise<AttendanceRecordDto> {
  if (USE_REAL_ATTENDANCE_API) {
    const record = await checkInMember({
      memberId: input.memberId,
      attendanceDate: input.date,
      notes: input.notes ?? undefined,
      markingMethod: "MANUAL",
    });
    return fromApiRecord(record);
  }
  const created = addDemoCheckIn({
    memberId: input.memberId,
    date: input.date,
    time: input.time,
    notes: input.notes ?? null,
  });
  return wait(toRecordDto(created));
}

export async function recordCheckOut(input: CheckOutInput): Promise<AttendanceRecordDto> {
  if (USE_REAL_ATTENDANCE_API) {
    if (!input.memberId) {
      throw new Error("memberId is required to check out with the live API.");
    }
    const record = await checkOutMember({
      memberId: input.memberId,
      notes: input.notes ?? undefined,
    });
    return fromApiRecord(record);
  }
  const updated = addDemoCheckOut(input.recordId, input.time);
  if (!updated) {
    throw new Error("Attendance record not found.");
  }
  return wait(toRecordDto(updated));
}

export async function getDeviceStatus(
  memberIds: string[] = [],
): Promise<AttendanceDeviceDto> {
  // Device/enrollment management is not exposed by the API yet.
  return wait(demoDeviceStatus(memberIds));
}

export async function listEnrollments(
  memberIds: string[],
): Promise<AttendanceEnrollmentDto[]> {
  return wait(demoEnrollments(memberIds));
}

export type { DemoAttendanceMethod };
