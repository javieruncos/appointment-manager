export const VENUE_TIME_ZONE = "America/Argentina/Buenos_Aires";

const LOCAL_DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function zonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VENUE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

export function getTodayInVenueTimeZone(now = new Date()): string {
  const parts = zonedParts(now);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getNowMinutesInVenueTimeZone(now = new Date()): number {
  const parts = zonedParts(now);
  return Number(parts.hour) * 60 + Number(parts.minute);
}

export function isValidLocalDate(value: string | undefined): value is string {
  if (!value || !LOCAL_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function addDays(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));

  return shifted.toISOString().slice(0, 10);
}

export function getDayOfWeek(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function toDisplayDate(value: string): Date {
  return new Date(`${value}T12:00:00Z`);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatDateShort(value: string): string {
  return capitalize(
    new Intl.DateTimeFormat("es-AR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(toDisplayDate(value)),
  );
}

export function formatDateLong(value: string): string {
  return capitalize(
    new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(toDisplayDate(value)),
  );
}

export function formatDateWithYear(value: string): string {
  return capitalize(
    new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(toDisplayDate(value)),
  );
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) {
    return "0 min";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
}

export function getDateLabel(value: string, today: string): string {
  return value === today
    ? `Hoy, ${formatDateShort(value)}`
    : formatDateShort(value);
}
