import type { BookingView } from "@/types/view";
import type { MatchView } from "@/types/view";

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
