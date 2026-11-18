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
  TournamentFormat,
  TournamentMatchPhase,
  TournamentMatchStatus,
  TournamentStatus,
} from "@/types/domain";
import type {
  BookingView,
  CourtView,
  MatchView,
  TournamentView,
  VenueView,
} from "@/types/view";

type RawRecord = Record<string, unknown>;

function toPlainRecord(value: unknown): RawRecord {
  return JSON.parse(JSON.stringify(value)) as RawRecord;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function optionalNumber(value: unknown): number | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function asId(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "toString" in value) {
    return String(value);
  }

  return "";
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(asId).filter((id) => id.length > 0);
}

function toOperatingHours(value: unknown): OperatingHour[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const raw = item as RawRecord;

    return {
      dayOfWeek: asNumber(raw.dayOfWeek) as OperatingHour["dayOfWeek"],
      isOpen: asBoolean(raw.isOpen),
      openTime: asString(raw.openTime),
      closeTime: asString(raw.closeTime),
    };
  });
}

function toPricing(value: unknown): CourtPricing[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const raw = item as RawRecord;

    return {
      label: asString(raw.label),
      startTime: asString(raw.startTime),
      endTime: asString(raw.endTime),
      price: asNumber(raw.price),
    };
  });
}

function toCustomer(value: unknown): BookingCustomer | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const raw = value as RawRecord;
  const name = asString(raw.name);
  const phone = asString(raw.phone);

  if (!name || !phone) {
    return undefined;
  }

  return {
    name,
    phone,
    email: optionalString(raw.email),
  };
}

function toPayment(value: unknown): BookingPayment {
  const raw = value && typeof value === "object" ? (value as RawRecord) : {};

  return {
    totalAmount: asNumber(raw.totalAmount),
    paidAmount: asNumber(raw.paidAmount),
    method: (asString(raw.method, "NONE") as BookingPayment["method"]) ?? "NONE",
  };
}

export function toVenueView(doc: unknown): VenueView {
  const raw = toPlainRecord(doc);

  return {
    id: asId(raw._id ?? raw.id),
    name: asString(raw.name),
    address: optionalString(raw.address),
    phone: optionalString(raw.phone),
    slotDurationMinutes: asNumber(raw.slotDurationMinutes, 60),
    depositPercentage: asNumber(raw.depositPercentage, 30),
    operatingHours: toOperatingHours(raw.operatingHours),
  };
}

export function toCourtView(doc: unknown): CourtView {
  const raw = toPlainRecord(doc);

  return {
    id: asId(raw._id ?? raw.id),
    name: asString(raw.name),
    format: asString(raw.format) as CourtFormat,
    surface: asString(raw.surface) as CourtSurface,
    isIndoor: asBoolean(raw.isIndoor),
    status: asString(raw.status) as CourtStatus,
    pricing: toPricing(raw.pricing),
  };
}

export function toBookingView(doc: unknown): BookingView {
  const raw = toPlainRecord(doc);

  return {
    id: asId(raw._id ?? raw.id),
    courtId: asId(raw.courtId),
    date: asString(raw.date),
    startTime: asString(raw.startTime),
    endTime: asString(raw.endTime),
    type: asString(raw.type) as BookingType,
    status: asString(raw.status) as BookingStatus,
    customer: toCustomer(raw.customer),
    payment: toPayment(raw.payment),
    tournamentMatchId: optionalString(raw.tournamentMatchId),
    notes: optionalString(raw.notes),
  };
}

export function toTournamentView(doc: unknown): TournamentView {
  const raw = toPlainRecord(doc);

  return {
    id: asId(raw._id ?? raw.id),
    name: asString(raw.name),
    category: asString(raw.category),
    description: optionalString(raw.description),
    format: asString(raw.format) as TournamentFormat,
    status: asString(raw.status) as TournamentStatus,
    startDate: asString(raw.startDate),
    endDate: asString(raw.endDate),
    registrationDeadline: optionalString(raw.registrationDeadline),
    maxTeams: asNumber(raw.maxTeams),
    entryFee: asNumber(raw.entryFee),
    courtIds: toStringArray(raw.courtIds),
    notes: optionalString(raw.notes),
  };
}

export function toMatchView(doc: unknown): MatchView {
  const raw = toPlainRecord(doc);

  return {
    id: asId(raw._id ?? raw.id),
    tournamentId: asId(raw.tournamentId),
    courtId: optionalString(raw.courtId),
    date: optionalString(raw.date),
    startTime: optionalString(raw.startTime),
    endTime: optionalString(raw.endTime),
    homeTeamName: asString(raw.homeTeamName),
    awayTeamName: asString(raw.awayTeamName),
    groupName: optionalString(raw.groupName),
    status: asString(raw.status) as TournamentMatchStatus,
    phase: asString(raw.phase) as TournamentMatchPhase,
    round: asNumber(raw.round),
    matchNumber: asNumber(raw.matchNumber),
    homeScore: optionalNumber(raw.homeScore),
    awayScore: optionalNumber(raw.awayScore),
  };
}
