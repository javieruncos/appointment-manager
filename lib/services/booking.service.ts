import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { BookingModel } from "@/lib/db/models/Booking";
import { CourtModel } from "@/lib/db/models/Court";
import {
  bookingSchema,
  updateBookingSchema,
  type BookingInput,
} from "@/lib/validations/booking.schema";
import type { BookingStatus } from "@/types/domain";

export type BookingFilters = {
  date?: string;
  courtId?: string;
  status?: BookingStatus;
};

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

  const existing = await BookingModel.findOne({
    courtId: data.courtId,
    date: data.date,
    status: { $ne: "CANCELLED" },
    $or: [
      { startTime: { $lte: data.startTime }, endTime: { $gt: data.startTime } },
      { startTime: { $lt: data.endTime }, endTime: { $gte: data.endTime } },
    ],
  });

  if (existing) {
    throw new Error("La cancha ya tiene una reserva en ese horario");
  }

  return BookingModel.create(data);
}

export async function updateBookingStatus(id: string, status: string) {
  const data = updateBookingSchema.parse({ status });

  await connectDB();

  if (!isValidObjectId(id)) {
    return null;
  }

  return BookingModel.findByIdAndUpdate(
    id,
    { $set: { status: data.status } },
    { new: true, runValidators: true }
  );
}