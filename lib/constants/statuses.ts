import type { BookingStatus, TournamentMatchStatus } from "@/types/domain";

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "COMPLETED",
];

export const ACTIVE_MATCH_STATUSES: TournamentMatchStatus[] = [
  "SCHEDULED",
  "PLAYING",
];
