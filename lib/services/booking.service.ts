import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { BookingModel } from "@/lib/db/models/Booking";
import { CourtModel } from "@/lib/db/models/Court";
import { TournamentMatchModel } from "@/lib/db/models/TournamentMatch";
import {
  bookingSchema,
  updateBookingSchema,
  type BookingInput,
} from "@/lib/validations/booking.schema";
import type {
  BookingStatus,
  TournamentMatchStatus,
} from "@/types/domain";
import {
  intervalsOverlap,
  isCompleteSchedule,
  shiftDate,
  toInterval,
  type ScheduleSlot,
} from "@/lib/utils/schedule";

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "COMPLETED",
];

const ACTIVE_MATCH_STATUSES: TournamentMatchStatus[] = [
  "SCHEDULED",
  "PLAYING",
];

export type BookingFilters = {
  date?: string;
  courtId?: string;
  status?: BookingStatus;
};

type OverlapExclusions = {
  bookingId?: string;
  tournamentMatchId?: string;
};

async function hasOverlappingSchedule(
  slot: ScheduleSlot,
  courtId: string,
  exclusions: OverlapExclusions = {},
): Promise<boolean> {
  const target = toInterval(slot);
  const dates = [
    shiftDate(slot.date, -1),
    slot.date,
    shiftDate(slot.date, 1),
  ];

  const [bookings, matches] = await Promise.all([
    BookingModel.find({
      courtId,
      status: { $in: ACTIVE_BOOKING_STATUSES },
      date: { $in: dates },
      ...(exclusions.bookingId
        ? { _id: { $ne: exclusions.bookingId } }
        : {}),
    }).select("date startTime endTime"),
    TournamentMatchModel.find({
      courtId,
      status: { $in: ACTIVE_MATCH_STATUSES },
      date: { $in: dates },
      ...(exclusions.tournamentMatchId
        ? { _id: { $ne: exclusions.tournamentMatchId } }
        : {}),
      ...(exclusions.bookingId
        ? { bookingId: { $ne: exclusions.bookingId } }
        : {}),
    }).select("date startTime endTime"),
  ]);

  const occupiedMatches: ScheduleSlot[] = [];

  for (const match of matches) {
    if (isCompleteSchedule(match)) {
      occupiedMatches.push({
        date: match.date,
        startTime: match.startTime,
        endTime: match.endTime,
      });
    }
  }

  return [...bookings, ...occupiedMatches].some((candidate) =>
    intervalsOverlap(target, toInterval(candidate)),
  );
}

export async function getBookings(filters: BookingFilters = {}) {
  await connectDB();

  if (filters.courtId && !isValidObjectId(filters.courtId)) {
    return [];
  }

  const query: Record<string, unknown> = {};
  if (filters.date) query.date = filters.date;
  if (filters.courtId) query.courtId = filters.courtId;
  if (filters.status) query.status = filters.status;

  return BookingModel.find(query).sort({ date: 1, startTime: 1 });
}

export async function getBookingById(id: string) {
  await connectDB();

  if (!isValidObjectId(id)) {
    return null;
  }

  return BookingModel.findById(id);
}

export async function createBooking(input: BookingInput) {
  const data = bookingSchema.parse(input);

  await connectDB();

  const court = await CourtModel.findById(data.courtId);
  if (!court || court.status !== "ACTIVE") {
    throw new Error("La cancha no está disponible o no existe");
  }

  const overlap = await hasOverlappingSchedule(
    {
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
    },
    data.courtId,
    { tournamentMatchId: data.tournamentMatchId ?? undefined },
  );

  if (overlap) {
    throw new Error(
      "La cancha ya tiene una reserva o partido en ese horario",
    );
  }

  return BookingModel.create(data);
}

export async function updateBookingStatus(
  id: string,
  status: string,
) {
  const data = updateBookingSchema.parse({ status });

  await connectDB();

  if (!isValidObjectId(id)) {
    return null;
  }

  const nextStatus = data.status;

  if (!nextStatus) {
    throw new Error("Estado de reserva inválido");
  }

  const booking = await BookingModel.findById(id);

  if (!booking) {
    return null;
  }

  if (
    booking.status === "CANCELLED" &&
    nextStatus !== "CANCELLED"
  ) {
    const overlap = await hasOverlappingSchedule(
      {
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
      },
      booking.courtId.toString(),
      {
        bookingId: id,
        tournamentMatchId: booking.tournamentMatchId?.toString(),
      },
    );

    if (overlap) {
      throw new Error(
        "No se puede reactivar la reserva: el horario ya está ocupado",
      );
    }
  }

  booking.status = nextStatus;

  await booking.save();

  return booking;
}
