import type {
  BookingStatus,
  CourtFormat,
  CourtSurface,
  TournamentMatchStatus,
} from "@/types/domain";
import type {
  BookingView,
  CourtView,
  MatchView,
  VenueView,
} from "@/types/view";
import { getDayOfWeek } from "@/lib/utils/date";

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "COMPLETED",
];

export const ACTIVE_MATCH_STATUSES: TournamentMatchStatus[] = [
  "SCHEDULED",
  "PLAYING",
];

const ACTIVE_BOOKING_SET = new Set<BookingStatus>(ACTIVE_BOOKING_STATUSES);
const ACTIVE_MATCH_SET = new Set<TournamentMatchStatus>(ACTIVE_MATCH_STATUSES);

const STEP_MINUTES = 30;
const MINUTES_PER_DAY = 24 * 60;

const HEIGHT_CLASSES: Record<number, string> = {
  1: "h-8",
  2: "h-16",
  3: "h-24",
  4: "h-32",
  5: "h-40",
  6: "h-48",
  7: "h-56",
  8: "h-64",
  9: "h-72",
  10: "h-80",
  11: "h-88",
  12: "h-96",
  13: "h-104",
  14: "h-112",
  15: "h-120",
  16: "h-128",
};

export type MinuteRange = {
  start: number;
  end: number;
};

export type VenueDayStatus = "no-config" | "closed" | "open";

export type FreeCell = {
  start: number;
  end: number;
  startTime: string;
  endTime: string;
  bookable: boolean;
};

export type FreeSegment = {
  kind: "free";
  start: number;
  end: number;
  cells: FreeCell[];
};

export type BookingSegment = {
  kind: "booking";
  start: number;
  end: number;
  booking: BookingView;
};

export type MatchSegment = {
  kind: "match";
  start: number;
  end: number;
  match: MatchView;
};

export type CourtSegment = FreeSegment | BookingSegment | MatchSegment;

export type AvailabilitySlot = {
  start: number;
  end: number;
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: "occupied" | "no-price";
};

export type Occupancy = {
  bookedMinutes: number;
  totalMinutes: number;
  percentage: number | null;
};

export type CourtOccupancy = Occupancy & {
  courtId: string;
};

export type DashboardMetrics = {
  occupancy: Occupancy;
  collected: number;
  pending: number;
  activeBookings: number;
};

export type HourCell = {
  start: number;
  end: number;
  label: string;
  heightClass: string;
};

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function minutesToTime(value: number): string {
  const normalized = ((value % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function normalizeRange(startTime: string, endTime: string): MinuteRange {
  const start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);

  if (end <= start) {
    end += MINUTES_PER_DAY;
  }

  return { start, end };
}

export function formatTimeRange(start: number, end: number): string {
  return `${minutesToTime(start)} – ${minutesToTime(end)}`;
}

export function formatDuration(minutes: number): string {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;

  if (hours === 0) {
    return `${remainder} min`;
  }

  if (remainder === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainder} min`;
}

export function getHeightClass(minutes: number): string {
  const units = Math.max(1, Math.ceil(minutes / STEP_MINUTES));
  return HEIGHT_CLASSES[Math.min(units, 16)] ?? "h-128";
}

function toWindow(openTime: string, closeTime: string): MinuteRange {
  const start = timeToMinutes(openTime);
  let end = timeToMinutes(closeTime);

  if (end <= start) {
    end += MINUTES_PER_DAY;
  }

  return { start, end };
}

export function getVenueDayStatus(
  venue: VenueView,
  date: string,
): VenueDayStatus {
  if (venue.operatingHours.length === 0) {
    return "no-config";
  }

  const hours = venue.operatingHours.find(
    (item) => item.dayOfWeek === getDayOfWeek(date),
  );

  if (!hours || !hours.isOpen) {
    return "closed";
  }

  return "open";
}

export function getVenueWindow(
  venue: VenueView,
  date: string,
): MinuteRange | null {
  if (getVenueDayStatus(venue, date) !== "open") {
    return null;
  }

  const hours = venue.operatingHours.find(
    (item) => item.dayOfWeek === getDayOfWeek(date),
  );

  if (!hours) {
    return null;
  }

  return toWindow(hours.openTime, hours.closeTime);
}

export function getPricingWindow(court: CourtView): MinuteRange | null {
  if (court.pricing.length === 0) {
    return null;
  }

  let start = Number.POSITIVE_INFINITY;
  let end = Number.NEGATIVE_INFINITY;

  for (const pricing of court.pricing) {
    const range = normalizeRange(pricing.startTime, pricing.endTime);
    start = Math.min(start, range.start);
    end = Math.max(end, range.end);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }

  return { start, end };
}

export function intersectWindows(
  first: MinuteRange,
  second: MinuteRange,
): MinuteRange | null {
  const start = Math.max(first.start, second.start);
  const end = Math.min(first.end, second.end);

  return end > start ? { start, end } : null;
}

export function getCourtBookableWindow(
  court: CourtView,
  venue: VenueView,
  date: string,
): MinuteRange | null {
  const status = getVenueDayStatus(venue, date);

  if (status === "closed") {
    return null;
  }

  const pricingWindow = getPricingWindow(court);
  const venueWindow = getVenueWindow(venue, date);

  if (status === "open" && venueWindow) {
    return pricingWindow
      ? intersectWindows(venueWindow, pricingWindow)
      : null;
  }

  return pricingWindow;
}

function getPricingSegment(
  court: CourtView,
  start: number,
): { start: number; end: number; price: number } | null {
  for (const pricing of court.pricing) {
    const range = normalizeRange(pricing.startTime, pricing.endTime);

    if (start >= range.start && start < range.end) {
      return { ...range, price: pricing.price };
    }
  }

  return null;
}

export function getHourlyRate(
  court: CourtView,
  start: number,
): number | null {
  return getPricingSegment(court, start)?.price ?? null;
}

export function getRangeRate(
  court: CourtView,
  start: number,
  duration: number,
): number | null {
  const segment = getPricingSegment(court, start);

  if (!segment || start + duration > segment.end) {
    return null;
  }

  return segment.price;
}

export function getMinPrice(court: CourtView): number | null {
  if (court.pricing.length === 0) {
    return null;
  }

  return Math.min(...court.pricing.map((pricing) => pricing.price));
}

export function getDurationOptions(venue: VenueView): number[] {
  return Array.from(
    new Set([venue.slotDurationMinutes, 60, 90].filter((value) => value >= 30)),
  ).sort((first, second) => first - second);
}

function rangesOverlap(first: MinuteRange, second: MinuteRange): boolean {
  return first.start < second.end && second.start < first.end;
}

function getItemRanges(
  bookings: BookingView[],
  matches: MatchView[],
  courtId: string,
): MinuteRange[] {
  const ranges: MinuteRange[] = [];

  for (const booking of bookings) {
    if (
      booking.courtId === courtId &&
      ACTIVE_BOOKING_SET.has(booking.status)
    ) {
      ranges.push(normalizeRange(booking.startTime, booking.endTime));
    }
  }

  for (const match of matches) {
    if (
      match.courtId === courtId &&
      match.date &&
      match.startTime &&
      match.endTime &&
      ACTIVE_MATCH_SET.has(match.status)
    ) {
      ranges.push(normalizeRange(match.startTime, match.endTime));
    }
  }

  return ranges;
}

function clipToWindow(
  range: MinuteRange,
  window: MinuteRange,
): MinuteRange | null {
  const start = Math.max(range.start, window.start);
  const end = Math.min(range.end, window.end);

  return end > start ? { start, end } : null;
}

function sumMergedRanges(ranges: MinuteRange[]): number {
  if (ranges.length === 0) {
    return 0;
  }

  const sorted = [...ranges].sort((first, second) => first.start - second.start);
  let total = 0;
  let current = { ...sorted[0] };

  for (const range of sorted.slice(1)) {
    if (range.start <= current.end) {
      current.end = Math.max(current.end, range.end);
    } else {
      total += current.end - current.start;
      current = { ...range };
    }
  }

  total += current.end - current.start;

  return total;
}

export function getCourtOccupancy(
  court: CourtView,
  venue: VenueView,
  date: string,
  bookings: BookingView[],
  matches: MatchView[],
): CourtOccupancy {
  const window = getCourtBookableWindow(court, venue, date);

  if (!window) {
    return {
      courtId: court.id,
      bookedMinutes: 0,
      totalMinutes: 0,
      percentage: null,
    };
  }

  const intervals = getItemRanges(bookings, matches, court.id)
    .map((range) => clipToWindow(range, window))
    .filter((range): range is MinuteRange => range !== null);

  const bookedMinutes = sumMergedRanges(intervals);
  const totalMinutes = window.end - window.start;

  return {
    courtId: court.id,
    bookedMinutes,
    totalMinutes,
    percentage:
      totalMinutes > 0
        ? Math.round((bookedMinutes / totalMinutes) * 100)
        : null,
  };
}

export function getDashboardMetrics(
  courts: CourtView[],
  venue: VenueView,
  date: string,
  bookings: BookingView[],
  matches: MatchView[],
): DashboardMetrics {
  let bookedMinutes = 0;
  let totalMinutes = 0;

  for (const court of courts) {
    const occupancy = getCourtOccupancy(court, venue, date, bookings, matches);
    bookedMinutes += occupancy.bookedMinutes;
    totalMinutes += occupancy.totalMinutes;
  }

  const activeBookings = bookings.filter((booking) =>
    ACTIVE_BOOKING_SET.has(booking.status),
  );

  const collected = activeBookings.reduce(
    (total, booking) => total + booking.payment.paidAmount,
    0,
  );

  const pending = activeBookings.reduce(
    (total, booking) =>
      total + Math.max(0, booking.payment.totalAmount - booking.payment.paidAmount),
    0,
  );

  return {
    occupancy: {
      bookedMinutes,
      totalMinutes,
      percentage:
        totalMinutes > 0
          ? Math.round((bookedMinutes / totalMinutes) * 100)
          : null,
    },
    collected,
    pending,
    activeBookings: activeBookings.length,
  };
}

function getScheduleItems(
  bookings: BookingView[],
  matches: MatchView[],
): Array<
  | { kind: "booking"; range: MinuteRange; booking: BookingView }
  | { kind: "match"; range: MinuteRange; match: MatchView }
> {
  const items: Array<
    | { kind: "booking"; range: MinuteRange; booking: BookingView }
    | { kind: "match"; range: MinuteRange; match: MatchView }
  > = [];

  for (const booking of bookings) {
    items.push({
      kind: "booking",
      range: normalizeRange(booking.startTime, booking.endTime),
      booking,
    });
  }

  for (const match of matches) {
    if (match.startTime && match.endTime) {
      items.push({
        kind: "match",
        range: normalizeRange(match.startTime, match.endTime),
        match,
      });
    }
  }

  return items;
}

export function getScheduleWindow(
  courts: CourtView[],
  venue: VenueView,
  date: string,
  bookings: BookingView[],
  matches: MatchView[],
): MinuteRange | null {
  const status = getVenueDayStatus(venue, date);
  const itemRanges = getScheduleItems(bookings, matches).map((item) => item.range);

  if (status === "closed" && itemRanges.length === 0) {
    return null;
  }

  const venueWindow = getVenueWindow(venue, date);
  const pricingWindows = courts
    .map(getPricingWindow)
    .filter((window): window is MinuteRange => window !== null);

  let base: MinuteRange | null = status === "closed" ? null : venueWindow;

  if (!base && pricingWindows.length > 0) {
    base = {
      start: Math.min(...pricingWindows.map((window) => window.start)),
      end: Math.max(...pricingWindows.map((window) => window.end)),
    };
  }

  if (!base && itemRanges.length > 0) {
    base = {
      start: Math.min(...itemRanges.map((range) => range.start)),
      end: Math.max(...itemRanges.map((range) => range.end)),
    };
  }

  if (!base) {
    return null;
  }

  if (itemRanges.length > 0) {
    base = {
      start: Math.min(base.start, ...itemRanges.map((range) => range.start)),
      end: Math.max(base.end, ...itemRanges.map((range) => range.end)),
    };
  }

  return {
    start: Math.floor(base.start / STEP_MINUTES) * STEP_MINUTES,
    end: Math.ceil(base.end / STEP_MINUTES) * STEP_MINUTES,
  };
}

export function getHourCells(window: MinuteRange): HourCell[] {
  const cells: HourCell[] = [];
  let cursor = window.start;

  while (cursor < window.end) {
    const end = Math.min(cursor + 60, window.end);
    const units = (end - cursor) / STEP_MINUTES;

    cells.push({
      start: cursor,
      end,
      label: minutesToTime(cursor),
      heightClass: units === 1 ? "h-8" : "h-16",
    });

    cursor = end;
  }

  return cells;
}

function getFreeCells(
  start: number,
  end: number,
  court: CourtView,
): FreeCell[] {
  const cells: FreeCell[] = [];
  let cursor = start;

  while (cursor < end) {
    const cellEnd = Math.min(cursor + 60, end);

    cells.push({
      start: cursor,
      end: cellEnd,
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(cellEnd),
      bookable: getHourlyRate(court, cursor) !== null,
    });

    cursor = cellEnd;
  }

  return cells;
}

export function getCourtSegments(
  court: CourtView,
  bookings: BookingView[],
  matches: MatchView[],
  window: MinuteRange,
): CourtSegment[] {
  const items = getScheduleItems(bookings, matches)
    .filter((item) => {
      if (item.kind === "booking") {
        return item.booking.courtId === court.id;
      }

      return item.match.courtId === court.id;
    })
    .filter(
      (item) =>
        item.range.end > window.start && item.range.start < window.end,
    )
    .sort((first, second) => first.range.start - second.range.start);

  const segments: CourtSegment[] = [];
  let cursor = window.start;

  for (const item of items) {
    const start = Math.max(item.range.start, cursor);
    const end = Math.min(item.range.end, window.end);

    if (end <= start) {
      continue;
    }

    if (start > cursor) {
      segments.push({
        kind: "free",
        start: cursor,
        end: start,
        cells: getFreeCells(cursor, start, court),
      });
    }

    if (item.kind === "booking") {
      segments.push({
        kind: "booking",
        start,
        end,
        booking: item.booking,
      });
    } else {
      segments.push({
        kind: "match",
        start,
        end,
        match: item.match,
      });
    }

    cursor = end;
  }

  if (cursor < window.end) {
    segments.push({
      kind: "free",
      start: cursor,
      end: window.end,
      cells: getFreeCells(cursor, window.end, court),
    });
  }

  return segments;
}

export function getAvailabilitySlots(
  court: CourtView,
  venue: VenueView,
  date: string,
  duration: number,
  bookings: BookingView[],
  matches: MatchView[],
): AvailabilitySlot[] {
  const window = getCourtBookableWindow(court, venue, date);

  if (!window) {
    return [];
  }

  const occupied = getItemRanges(bookings, matches, court.id);
  const slots: AvailabilitySlot[] = [];

  for (
    let start = window.start;
    start + duration <= window.end;
    start += STEP_MINUTES
  ) {
    const end = start + duration;
    const range = { start, end };
    const hasPrice = getRangeRate(court, start, duration) !== null;

    if (!hasPrice) {
      slots.push({
        start,
        end,
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
        available: false,
        reason: "no-price",
      });
      continue;
    }

    const isOccupied = occupied.some((item) => rangesOverlap(range, item));

    slots.push({
      start,
      end,
      startTime: minutesToTime(start),
      endTime: minutesToTime(end),
      available: !isOccupied,
      reason: isOccupied ? "occupied" : undefined,
    });
  }

  return slots;
}

export function isBookingLive(
  booking: BookingView,
  date: string,
  today: string,
  nowMinutes: number | null,
): boolean {
  if (nowMinutes === null || booking.status !== "CONFIRMED") {
    return false;
  }

  const range = normalizeRange(booking.startTime, booking.endTime);

  if (booking.date === today) {
    return nowMinutes >= range.start && nowMinutes < range.end;
  }

  if (booking.date === date && date !== today && range.end > MINUTES_PER_DAY) {
    return (
      nowMinutes + MINUTES_PER_DAY >= range.start &&
      nowMinutes + MINUTES_PER_DAY < range.end
    );
  }

  return false;
}

export function isMatchLive(
  match: MatchView,
  today: string,
  nowMinutes: number | null,
): boolean {
  if (
    nowMinutes === null ||
    match.status !== "PLAYING" ||
    !match.startTime ||
    !match.endTime
  ) {
    return false;
  }

  const range = normalizeRange(match.startTime, match.endTime);

  return nowMinutes >= range.start && nowMinutes < range.end;
}

export function getBookingStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    PENDING_PAYMENT: "Seña pendiente",
    CONFIRMED: "Confirmado",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
  };

  return labels[status];
}

export function getMatchStatusLabel(status: TournamentMatchStatus): string {
  const labels: Record<TournamentMatchStatus, string> = {
    PENDING_SCHEDULE: "Sin programar",
    SCHEDULED: "Programado",
    PLAYING: "En juego",
    FINISHED: "Finalizado",
    POSTPONED: "Postergado",
    CANCELLED: "Cancelado",
  };

  return labels[status];
}

export function calculateBookingTotal(rate: number, durationMinutes: number): number {
  return Math.round((rate * durationMinutes) / 60);
}

export function calculateDeposit(total: number, depositPercentage: number): number {
  return Math.round((total * depositPercentage) / 100);
}



export function getFormatLabel(format: CourtFormat): string {
  const labels: Record<CourtFormat, string> = {
    F5: "Fútbol 5",
    F7: "Fútbol 7",
    F8: "Fútbol 8",
    F11: "Fútbol 11",
  };

  return labels[format];
}

export function getSurfaceLabel(surface: CourtSurface): string {
  const labels: Record<CourtSurface, string> = {
    SINTETICO: "Sintético",
    CESPED: "Césped",
    CEMENTO: "Cemento",
  };

  return labels[surface];
}
