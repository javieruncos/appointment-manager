import type {
  BookingCustomer,
  BookingPayment,
  BookingStatus,
  BookingType,
  CourtFormat,
  CourtPricing,
  CourtStatus,
  CourtSurface,
  OperatingHour,
  TournamentMatchPhase,
  TournamentMatchStatus,
} from "@/types/domain";

export type VenueView = {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  slotDurationMinutes: number;
  depositPercentage: number;
  operatingHours: OperatingHour[];
};

export type CourtView = {
  id: string;
  name: string;
  format: CourtFormat;
  surface: CourtSurface;
  isIndoor: boolean;
  status: CourtStatus;
  pricing: CourtPricing[];
};

export type BookingView = {
  id: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: BookingType;
  status: BookingStatus;
  customer?: BookingCustomer;
  payment: BookingPayment;
  tournamentMatchId?: string | null;
  notes?: string;
};

export type MatchView = {
  id: string;
  tournamentId: string;
  courtId?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  homeTeamName: string;
  awayTeamName: string;
  groupName?: string;
  status: TournamentMatchStatus;
  phase: TournamentMatchPhase;
  round: number;
  matchNumber: number;
  homeScore?: number | null;
  awayScore?: number | null;
};

export type DashboardData = {
  venue: VenueView;
  courts: CourtView[];
  bookings: BookingView[];
  matches: MatchView[];
};
