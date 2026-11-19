import type {
  CourtSegment,
  FreeCell,
  HourCell,
  MinuteRange,
} from "@/lib/utils/schedule-types";
import type { BookingView, CourtView, MatchView, VenueView } from "@/types/view";
import {
  getHourlyRate,
  getVenueDayStatus,
  getVenueWindow,
  normalizeRange,
  minutesToTime,
  getPricingWindow,
} from "@/lib/utils/schedule-calc";

const STEP_MINUTES = 30;
const MINUTES_PER_DAY = 24 * 60;

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
