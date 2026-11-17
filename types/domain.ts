export type EntityId = string;
export type LocalDate = string;
export type LocalTime = string;
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type VenueSingletonKey = "MAIN_VENUE";

export type CourtFormat = "F5" | "F7" | "F8" | "F11";
export type CourtSurface = "SINTETICO" | "CESPED" | "CEMENTO";
export type CourtStatus = "ACTIVE" | "MAINTENANCE";

export type BookingType = "CASUAL" | "RECURRING" | "TOURNAMENT" | "BLOCKED";
export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";
export type PaymentMethod = "CASH" | "TRANSFER" | "MERCADOPAGO" | "NONE";

export interface Timestamps {
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OperatingHour {
  dayOfWeek: DayOfWeek;
  isOpen: boolean;
  openTime: LocalTime;
  closeTime: LocalTime;
}

export interface VenueConfig extends Timestamps {
  id?: EntityId;
  singletonKey: VenueSingletonKey;
  name: string;
  address?: string;
  phone?: string;
  slotDurationMinutes: number;
  depositPercentage: number;
  operatingHours: OperatingHour[];
}

export interface CourtPricing {
  label: string;
  startTime: LocalTime;
  endTime: LocalTime;
  price: number;
}

export interface Court extends Timestamps {
  id?: EntityId;
  name: string;
  format: CourtFormat;
  surface: CourtSurface;
  isIndoor: boolean;
  status: CourtStatus;
  pricing: CourtPricing[];
}

export interface BookingCustomer {
  name: string;
  phone: string;
  email?: string;
}

export interface BookingPayment {
  totalAmount: number;
  paidAmount: number;
  method: PaymentMethod;
}

export interface Booking extends Timestamps {
  id?: EntityId;
  courtId: EntityId;
  date: LocalDate;
  startTime: LocalTime;
  endTime: LocalTime;
  type: BookingType;
  status: BookingStatus;
  customer?: BookingCustomer;
  payment: BookingPayment;
  tournamentMatchId?: EntityId | null;
  notes?: string;
}
