import { cache } from "react";
import { getBookings } from "@/lib/services/booking.service";
import { getCourts } from "@/lib/services/court.service";
import { getTournamentMatches } from "@/lib/services/tournament-match.service";
import { getVenueConfig } from "@/lib/services/venue.service";
import {
  toBookingView,
  toCourtView,
  toMatchView,
  toVenueView,
} from "@/lib/utils/view-models";
import type { DashboardData, VenueView } from "@/types/view";

const FALLBACK_VENUE: VenueView = {
  id: "fallback-venue",
  name: "Mi Complejo de Fútbol",
  slotDurationMinutes: 60,
  depositPercentage: 30,
  operatingHours: [],
};

async function safeValue<T>(
  loader: () => Promise<T>,
  fallback: T,
  label: string,
): Promise<T> {
  try {
    return await loader();
  } catch {
    console.error(`[dashboard] No se pudo cargar ${label}`);
    return fallback;
  }
}

async function safeList<T>(
  loader: () => Promise<T[]>,
  label: string,
): Promise<T[]> {
  try {
    return await loader();
  } catch {
    console.error(`[dashboard] No se pudo cargar ${label}`);
    return [];
  }
}

export const getShellVenue = cache(async (): Promise<VenueView> => {
  const doc = await safeValue<unknown | null>(
    () => getVenueConfig(),
    null,
    "la configuración del complejo",
  );

  return doc ? toVenueView(doc) : FALLBACK_VENUE;
});

export async function getDashboardData(date: string): Promise<DashboardData> {
  const [venue, courts, bookings, matches] = await Promise.all([
    getShellVenue(),
    safeList(() => getCourts(), "las canchas"),
    safeList(() => getBookings({ date }), "las reservas"),
    safeList(() => getTournamentMatches(), "los partidos de torneo"),
  ]);

  const dayMatches = matches.filter(
    (match) =>
      match.date === date && match.startTime != null && match.endTime != null,
  );

  return {
    venue,
    courts: courts.map(toCourtView),
    bookings: bookings.map(toBookingView),
    matches: dayMatches.map(toMatchView),
  };
}
