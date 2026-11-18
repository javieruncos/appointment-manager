import type {
  AvailabilitySlot,
  CourtOccupancy,
  DashboardMetrics,
  MinuteRange,
  VenueDayStatus,
} from "@/lib/utils/schedule-types";
import type { BookingView, CourtView, MatchView, VenueView } from "@/types/view";
import { ACTIVE_BOOKING_STATUSES, ACTIVE_MATCH_STATUSES } from "@/lib/constants/statuses";
import { getDayOfWeek } from "@/lib/utils/date";

const ACTIVE_BOOKING_SET = new Set(ACTIVE_BOOKING_STATUSES);
const ACTIVE_MATCH_SET = new Set(ACTIVE_MATCH_STATUSES);

const MINUTES_PER_DAY = 24 * 60;

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

export function getAvailabilitySlots(
  court: CourtView,
  venue: VenueView,
  date: string,
  duration: number,
  bookings: BookingView[],
  matches: MatchView[],
): AvailabilitySlot[] {
  const STEP_MINUTES = 30;
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

export function calculateBookingTotal(rate: number, durationMinutes: number): number {
  return Math.round((rate * durationMinutes) / 60);
}

export function calculateDeposit(total: number, depositPercentage: number): number {
  return Math.round((total * depositPercentage) / 100);
}
