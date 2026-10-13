import { apiRequest, type QueryParams } from "./api";
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

   ⚠️ When the backend adds these endpoints, set
      NEXT_PUBLIC_USE_REAL_ATTENDANCE_API=true
   and the same UI will call them without any component changes:

     GET    /attendance?from=&to=&status=&method=&planId=&memberId=&page=&pageSize=
     POST   /attendance/check-in   { memberId, date, time, notes, method }
     POST   /attendance/check-out  { recordId, time, notes }
     GET    /attendance/device
     GET    /attendance/enrollments

   No biometric verification is simulated and no device connectivity is claimed.
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

/**
 * Loads attendance records for a date window. In demo mode the store is seeded
 * from the real member ids the first time it is called.
 */
export async function listAttendance(
  memberIds: string[],
  params: { from?: string; to?: string } = {},
  signal?: AbortSignal,
): Promise<AttendanceRecordDto[]> {
  if (USE_REAL_ATTENDANCE_API) {
    return apiRequest<AttendanceRecordDto[]>("/attendance", {
      query: { from: params.from, to: params.to } as QueryParams,
      signal,
    });
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
    return apiRequest<AttendanceRecordDto>("/attendance/check-in", {
      method: "POST",
      body: input,
    });
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
    return apiRequest<AttendanceRecordDto>("/attendance/check-out", {
      method: "POST",
      body: input,
    });
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
  if (USE_REAL_ATTENDANCE_API) {
    return apiRequest<AttendanceDeviceDto>("/attendance/device");
  }
  return wait(demoDeviceStatus(memberIds));
}

export async function listEnrollments(
  memberIds: string[],
): Promise<AttendanceEnrollmentDto[]> {
  if (USE_REAL_ATTENDANCE_API) {
    return apiRequest<AttendanceEnrollmentDto[]>("/attendance/enrollments");
  }
  return wait(demoEnrollments(memberIds));
}

export type { DemoAttendanceMethod };
