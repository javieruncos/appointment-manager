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
import type { BookingStatus, TournamentMatchStatus } from "@/types/domain";
import {
  intervalsOverlap,
  isCompleteSchedule,
  shiftDate,
  toInterval,
  type ScheduleSlot,
} from "@/lib/utils/schedule-backend";

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

/**
 * Valida si un horario choca con otra reserva o partido existente.
 */
async function hasOverlappingSchedule(
  slot: ScheduleSlot,
  courtId: string,
  exclusions: { bookingId?: string; tournamentMatchId?: string } = {}
): Promise<boolean> {
  const target = toInterval(slot);
  const dates = [shiftDate(slot.date, -1), slot.date, shiftDate(slot.date, 1)];

  const [bookings, matches] = await Promise.all([
    BookingModel.find({
      courtId,
      status: { $in: ACTIVE_BOOKING_STATUSES },
      date: { $in: dates },
      ...(exclusions.bookingId && { _id: { $ne: exclusions.bookingId } }),
    }).select("date startTime endTime"),

    TournamentMatchModel.find({
      courtId,
      status: { $in: ACTIVE_MATCH_STATUSES },
      date: { $in: dates },
      ...(exclusions.tournamentMatchId && { _id: { $ne: exclusions.tournamentMatchId } }),
      ...(exclusions.bookingId && { bookingId: { $ne: exclusions.bookingId } }),
    }).select("date startTime endTime"),
  ]);

  const occupiedSlots: ScheduleSlot[] = [];

  // Validamos explícitamente para que TypeScript infiera que son strings puros
  for (const b of bookings) {
    if (b.date && b.startTime && b.endTime) {
      occupiedSlots.push({
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
      });
    }
  }

  for (const m of matches) {
    if (isCompleteSchedule(m)) {
      occupiedSlots.push({
        date: m.date,
        startTime: m.startTime,
        endTime: m.endTime,
      });
    }
  }

  console.log("Horario a evaluar:", target);
  console.log("Reservas activas encontradas:", bookings);
  console.log("Partidos activos encontrados:", matches);
  console.log("Slots ocupados totales:", occupiedSlots);

  return occupiedSlots.some((candidate) =>
    intervalsOverlap(target, toInterval(candidate))
  );
}

export async function getBookings(filters: BookingFilters = {}) {
  await connectDB();
  if (filters.courtId && !isValidObjectId(filters.courtId)) return [];

  const query: Record<string, unknown> = {};
  if (filters.date) query.date = filters.date;
  if (filters.courtId) query.courtId = filters.courtId;
  if (filters.status) query.status = filters.status;

  return BookingModel.find(query).sort({ date: 1, startTime: 1 });
}

export async function getBookingById(id: string) {
  await connectDB();
  if (!isValidObjectId(id)) return null;
  return BookingModel.findById(id);
}

export async function createBooking(input: BookingInput) {
  const data = bookingSchema.parse(input);
  await connectDB();

  // NUEVO: Validar que la fecha y hora de inicio no sean en el pasado
  const bookingStart = new Date(`${data.date}T${data.startTime}:00`);
  if (bookingStart.getTime() < Date.now()) {
    throw new Error("No se pueden crear reservas en horarios que ya pasaron.");
  }

  // 1. Validar que la cancha exista y esté activa
  const court = await CourtModel.findById(data.courtId);
  if (!court || court.status !== "ACTIVE") {
    throw new Error("La cancha no está disponible o no existe");
  }

  // 2. Validar choques de horarios
  const isOccupied = await hasOverlappingSchedule(
    { date: data.date, startTime: data.startTime, endTime: data.endTime },
    data.courtId,
    { tournamentMatchId: data.tournamentMatchId ?? undefined }
  );

  if (isOccupied) {
    throw new Error("La cancha ya tiene una reserva o partido en ese horario");
  }

  return BookingModel.create(data);
}

export async function updateBookingStatus(id: string, rawStatus: string) {
  const { status: newStatus } = updateBookingSchema.parse({ status: rawStatus });
  await connectDB();

  if (!isValidObjectId(id) || !newStatus) return null;

  const booking = await BookingModel.findById(id);
  if (!booking) return null;

  // Regla: Si una reserva cancelada vuelve a la vida, hay que revalidar el espacio
  const wasCancelled = booking.status === "CANCELLED";
  const willBeActive = ACTIVE_BOOKING_STATUSES.includes(newStatus);

  if (wasCancelled && willBeActive) {
    const isOccupied = await hasOverlappingSchedule(
      { date: booking.date!, startTime: booking.startTime!, endTime: booking.endTime! },
      booking.courtId.toString(),
      { bookingId: id, tournamentMatchId: booking.tournamentMatchId?.toString() }
    );

    if (isOccupied) {
      throw new Error("No se puede reactivar: el horario ya está ocupado");
    }
  }

  booking.status = newStatus;
  await booking.save();
  return booking;
}

export async function deleteBooking(id: string) {
  await connectDB();
  if (!isValidObjectId(id)) {
    throw new Error("ID de reserva inválido");
  }

  const deletedBooking = await BookingModel.findByIdAndDelete(id);
  if (!deletedBooking) {
    throw new Error("No se encontró la reserva para eliminar");
  }

  return deletedBooking;
}