/**
 * Date/time helpers for the landing-page "Schedule a Call" dialog.
 *
 * The backend stores `callTime` as an ISO 8601 timestamp, so all display
 * formatting happens in the visitor's local timezone and only the final value
 * is converted to UTC with `Date#toISOString()`.
 *
 * Slots are UI choices until `POST /api/v1/schedule/` accepts the request.
 */

export const SCHEDULE_DAY_COUNT = 12;
export const SCHEDULE_CALL_MINUTES = 30;

const SLOT_STEP_MINUTES = 30;
const FIRST_SLOT_MINUTES = 9 * 60;
const LAST_SLOT_MINUTES = 17 * 60 + 30;

/**
 * Leave a small buffer so a visitor cannot submit a slot that has already
 * started while they were filling in the form.
 */
const MINIMUM_LEAD_MS = 5 * 60 * 1000;

export type ScheduleTimeSlot = {
  /** Minutes from midnight, used as a stable selection key. */
  minutes: number;
  /** Local date + time for this slot. */
  date: Date;
  /** Example: "9:30 AM". */
  label: string;
  disabled: boolean;
};

export type ScheduleDateOption = {
  /** Local `YYYY-MM-DD` key (never derived from `toISOString()`). */
  key: string;
  date: Date;
  /** Example: "Thu". */
  weekday: string;
  /** Example: "15 Oct". */
  dayMonth: string;
  /** Full accessible label. */
  fullLabel: string;
  slots: ScheduleTimeSlot[];
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const WEEKDAY_LONG = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const TIME = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const DATE_TIME = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function localDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatTime(date: Date): string {
  return TIME.format(date);
}

export function formatCallDateTime(date: Date): string {
  return DATE_TIME.format(date);
}

/** Build the half-hour slots for one date, disabling times that have passed. */
export function buildScheduleTimeSlots(
  date: Date,
  now: Date = new Date(),
): ScheduleTimeSlot[] {
  const slots: ScheduleTimeSlot[] = [];
  const cutoff = now.getTime() + MINIMUM_LEAD_MS;

  for (
    let minutes = FIRST_SLOT_MINUTES;
    minutes <= LAST_SLOT_MINUTES;
    minutes += SLOT_STEP_MINUTES
  ) {
    const slotDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      Math.floor(minutes / 60),
      minutes % 60,
      0,
      0,
    );

    slots.push({
      minutes,
      date: slotDate,
      label: TIME.format(slotDate),
      disabled: slotDate.getTime() <= cutoff,
    });
  }

  return slots;
}

/**
 * Generate the next available dates (today onward) that still have at least
 * one time slot. Past days and days whose slots have all passed are skipped.
 */
export function buildScheduleDateOptions(
  now: Date = new Date(),
  count = SCHEDULE_DAY_COUNT,
): ScheduleDateOption[] {
  const options: ScheduleDateOption[] = [];
  const today = startOfLocalDay(now);

  // The limit avoids an accidental infinite loop on an unusual clock change.
  for (let offset = 0; options.length < count && offset < count + 14; offset += 1) {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);

    const slots = buildScheduleTimeSlots(date, now);
    if (!slots.some((slot) => !slot.disabled)) continue;

    options.push({
      key: localDateKey(date),
      date,
      weekday: WEEKDAY.format(date),
      dayMonth: `${date.getDate()} ${MONTHS[date.getMonth()]}`,
      fullLabel: WEEKDAY_LONG.format(date),
      slots,
    });
  }

  return options;
}

/** Remove formatting characters and keep an optional leading `+`. */
export function normalizeMobile(value: string): string {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Match the backend's `ScheduleCall.Mob` limit (13 characters). A typical
 * `+91` number with 10 local digits fits exactly.
 */
export function isValidMobile(value: string): boolean {
  const normalized = normalizeMobile(value);
  return normalized.length <= 13 && /^\+?\d{10,13}$/.test(normalized);
}
