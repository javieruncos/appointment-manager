export type ScheduleSlot = {
  date: string;
  startTime: string;
  endTime: string;
};

export type ScheduleInterval = {
  start: number;
  end: number;
};

export function toAbsoluteMinutes(date: string, time: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  return Date.UTC(year, month - 1, day) / 60_000 + hours * 60 + minutes;
}

export function toInterval(slot: ScheduleSlot): ScheduleInterval {
  const start = toAbsoluteMinutes(slot.date, slot.startTime);
  let end = toAbsoluteMinutes(slot.date, slot.endTime);

  if (end <= start) {
    end += 24 * 60;
  }

  return { start, end };
}

export function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));

  return shifted.toISOString().slice(0, 10);
}

export function intervalsOverlap(
  first: ScheduleInterval,
  second: ScheduleInterval,
): boolean {
  return first.start < second.end && second.start < first.end;
}

export function isCompleteSchedule(slot: {
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}): slot is ScheduleSlot {
  return (
    slot.date != null &&
    slot.startTime != null &&
    slot.endTime != null
  );
}
