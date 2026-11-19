import type { BookingStatus, CourtFormat, CourtSurface, TournamentMatchStatus } from "@/types/domain";
import { formatDuration } from "@/lib/utils/date";
import { minutesToTime } from "@/lib/utils/schedule-calc";

export { formatDuration };

export function formatTimeRange(start: number, end: number): string {
  return `${minutesToTime(start)} – ${minutesToTime(end)}`;
}

const STEP_MINUTES = 30;

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

export function getHeightClass(minutes: number): string {
  const units = Math.max(1, Math.ceil(minutes / STEP_MINUTES));
  return HEIGHT_CLASSES[Math.min(units, 16)] ?? "h-128";
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
