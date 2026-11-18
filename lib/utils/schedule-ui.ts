// Re-exports para compatibilidad con imports existentes.
// La lógica se encuentra dividida en módulos especializados.

// Tipos
export type {
  AvailabilitySlot,
  BookingSegment,
  CourtOccupancy,
  CourtSegment,
  DashboardMetrics,
  FreeCell,
  FreeSegment,
  HourCell,
  MatchSegment,
  MinuteRange,
  Occupancy,
  VenueDayStatus,
} from "@/lib/utils/schedule-types";

// Cálculos puros de negocio
export {
  calculateBookingTotal,
  calculateDeposit,
  getCourtBookableWindow,
  getCourtOccupancy,
  getDashboardMetrics,
  getDurationOptions,
  getAvailabilitySlots,
  getHourlyRate,
  getMinPrice,
  getRangeRate,
  getVenueDayStatus,
  getVenueWindow,
  minutesToTime,
  normalizeRange,
  timeToMinutes,
} from "@/lib/utils/schedule-calc";

// Presentación: labels, clases CSS, formateo visual
export {
  formatDuration,
  formatTimeRange,
  getBookingStatusLabel,
  getFormatLabel,
  getHeightClass,
  getMatchStatusLabel,
  getSurfaceLabel,
} from "@/lib/utils/schedule-display";

// Segmentación del grid
export {
  getCourtSegments,
  getHourCells,
  getScheduleWindow,
  isBookingLive,
  isMatchLive,
} from "@/lib/utils/schedule-segments";

// Constantes de estados (frontend)
export {
  ACTIVE_BOOKING_STATUSES,
  ACTIVE_MATCH_STATUSES,
} from "@/lib/constants/statuses";
