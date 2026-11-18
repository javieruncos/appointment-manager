"use client";

import { useMemo } from "react";
import type { AvailabilitySlot, MinuteRange, VenueDayStatus } from "@/lib/utils/schedule-types";
import type { BookingView, CourtView, MatchView, VenueView } from "@/types/view";
import {
  calculateBookingTotal,
  calculateDeposit,
  getAvailabilitySlots,
  getCourtBookableWindow,
  getDurationOptions,
  getRangeRate,
  getVenueDayStatus,
} from "@/lib/utils/schedule-calc";
import { formatDuration } from "@/lib/utils/schedule-display";

export type UseBookingCalculationsParams = {
  selectedCourt: CourtView | null;
  venue: VenueView;
  date: string;
  watchedDuration: number;
  watchedStartTime: string;
  bookings: BookingView[];
  matches: MatchView[];
};

export type BookingCalculations = {
  availableSlots: AvailabilitySlot[];
  selectedSlot: AvailabilitySlot | undefined;
  durationOptions: Array<{ value: string; label: string }>;
  bookableWindow: MinuteRange | null;
  dayStatus: VenueDayStatus;
  rate: number | null;
  total: number | null;
  deposit: number | null;
};

export function useBookingCalculations({
  selectedCourt,
  venue,
  date,
  watchedDuration,
  watchedStartTime,
  bookings,
  matches,
}: UseBookingCalculationsParams): BookingCalculations {
  const availableSlots = useMemo(() => {
    if (!selectedCourt) return [];
    return getAvailabilitySlots(
      selectedCourt,
      venue,
      date,
      watchedDuration,
      bookings,
      matches
    ).filter((slot) => slot.available);
  }, [selectedCourt, venue, date, watchedDuration, bookings, matches]);

  const selectedSlot = useMemo(
    () =>
      availableSlots.find((slot) => slot.startTime === watchedStartTime) ??
      availableSlots[0],
    [availableSlots, watchedStartTime]
  );

  const durationOptions = useMemo(
    () =>
      getDurationOptions(venue).map((minutes) => ({
        value: String(minutes),
        label: formatDuration(minutes),
      })),
    [venue]
  );

  const bookableWindow = selectedCourt
    ? getCourtBookableWindow(selectedCourt, venue, date)
    : null;

  const dayStatus = getVenueDayStatus(venue, date);

  const rate = useMemo(
    () =>
      selectedCourt && selectedSlot
        ? getRangeRate(selectedCourt, selectedSlot.start, watchedDuration)
        : null,
    [selectedCourt, selectedSlot, watchedDuration]
  );

  const total = useMemo(
    () => (rate === null ? null : calculateBookingTotal(rate, watchedDuration)),
    [rate, watchedDuration]
  );

  const deposit = useMemo(
    () => (total === null ? null : calculateDeposit(total, venue.depositPercentage)),
    [total, venue.depositPercentage]
  );

  return {
    availableSlots,
    selectedSlot,
    durationOptions,
    bookableWindow,
    dayStatus,
    rate,
    total,
    deposit,
  };
}
