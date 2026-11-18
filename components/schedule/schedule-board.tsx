"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CourtFormat } from "@/types/domain";
import type { BookingView, DashboardData } from "@/types/view";
import {
  getDashboardMetrics,
  getFormatLabel,
} from "@/lib/utils/schedule-ui";
import { getNowMinutesInVenueTimeZone } from "@/lib/utils/date";
import { useBookingSheet } from "@/components/layout/booking-sheet-context";
import { NewBookingSheet } from "@/components/bookings/new-booking-sheet";
import { ScheduleGrid } from "@/components/schedule/schedule-grid";
import { BookingDetailSheet } from "@/src/components/admin/BookingDetailSheet";
import {
  ScheduleHeader,
  type FormatFilter,
} from "@/components/schedule/schedule-header";

type ScheduleBoardProps = DashboardData & {
  date: string;
  today: string;
};

type SelectedSlot = {
  courtId: string;
  startTime: string;
};

export function ScheduleBoard({
  date,
  today,
  venue,
  courts,
  bookings,
  matches,
}: ScheduleBoardProps) {
  const router = useRouter();
  const { requestId } = useBookingSheet();
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("ALL");
  const [search, setSearch] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [handledRequestId, setHandledRequestId] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | undefined>();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);

  useEffect(() => {
    const updateNow = () => setNowMinutes(getNowMinutesInVenueTimeZone());
    updateNow();
    const interval = window.setInterval(updateNow, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const formats = useMemo(
    () => Array.from(new Set(courts.map((court) => court.format))),
    [courts],
  );

  const activeFormatFilter: FormatFilter =
    formatFilter === "ALL" || formats.includes(formatFilter)
      ? formatFilter
      : "ALL";

  const sheetOpen = manualOpen || requestId > handledRequestId;

  const formatOptions = useMemo(
    () => [
      { value: "ALL" as const, label: "Todas" },
      ...formats.map((format) => ({
        value: format as CourtFormat,
        label: getFormatLabel(format),
      })),
    ],
    [formats],
  );

  const visibleCourts = useMemo(
    () =>
      activeFormatFilter === "ALL"
        ? courts
        : courts.filter((court) => court.format === activeFormatFilter),
    [courts, activeFormatFilter],
  );

  const visibleCourtIds = useMemo(
    () => new Set(visibleCourts.map((court) => court.id)),
    [visibleCourts],
  );

  const visibleBookings = useMemo(
    () => bookings.filter((booking) => visibleCourtIds.has(booking.courtId)),
    [bookings, visibleCourtIds],
  );

  const visibleMatches = useMemo(
    () =>
      matches.filter(
        (match) => match.courtId != null && visibleCourtIds.has(match.courtId),
      ),
    [matches, visibleCourtIds],
  );

  const metrics = useMemo(
    () =>
      getDashboardMetrics(
        visibleCourts,
        venue,
        date,
        visibleBookings,
        visibleMatches,
      ),
    [visibleCourts, venue, date, visibleBookings, visibleMatches],
  );

  const openNewBooking = useCallback(() => {
    setSelectedSlot(undefined);
    setManualOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setManualOpen(false);
    setHandledRequestId(requestId);
    setSelectedSlot(undefined);
  }, [requestId]);

  const handleCreated = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleSelectSlot = useCallback((courtId: string, startTime: string) => {
    setSelectedSlot({ courtId, startTime });
    setManualOpen(true);
  }, []);

  const handleSelectBooking = useCallback((booking: BookingView) => {
    setSelectedBookingId(booking.id);
  }, []);

  const closeBookingDetail = useCallback(() => {
    setSelectedBookingId(null);
  }, []);

  const handleBookingUpdated = useCallback(() => {
    setSelectedBookingId(null);
    router.refresh();
  }, [router]);

  const selectedBooking = useMemo(
    () =>
      selectedBookingId
        ? (bookings.find((booking) => booking.id === selectedBookingId) ?? null)
        : null,
    [bookings, selectedBookingId],
  );

  const selectedBookingCourtName = selectedBooking
    ? courts.find((court) => court.id === selectedBooking.courtId)?.name
    : undefined;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <ScheduleHeader
        date={date}
        today={today}
        formatFilter={activeFormatFilter}
        formatOptions={formatOptions}
        onFormatChange={setFormatFilter}
        search={search}
        onSearchChange={setSearch}
        metrics={metrics}
        onNewBooking={openNewBooking}
      />

      <ScheduleGrid
        date={date}
        today={today}
        venue={venue}
        courts={visibleCourts}
        totalCourtCount={courts.length}
        bookings={visibleBookings}
        matches={visibleMatches}
        nowMinutes={nowMinutes}
        search={search}
        onSelectSlot={handleSelectSlot}
        onSelectBooking={handleSelectBooking}
      />

      {sheetOpen ? (
        <NewBookingSheet
          key={`${date}-${selectedSlot?.courtId ?? "new"}-${selectedSlot?.startTime ?? ""}`}
          open
          onClose={closeSheet}
          onCreated={handleCreated}
          venue={venue}
          courts={courts}
          date={date}
          initialCourtId={selectedSlot?.courtId}
          initialStartTime={selectedSlot?.startTime}
        />
      ) : null}

      {selectedBooking ? (
        <BookingDetailSheet
          key={selectedBooking.id}
          booking={selectedBooking}
          courtName={selectedBookingCourtName}
          onClose={closeBookingDetail}
          onUpdated={handleBookingUpdated}
        />
      ) : null}
    </div>
  );
}
