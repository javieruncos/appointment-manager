import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { BookingModel } from "@/lib/db/models/Booking";
import { CourtModel } from "@/lib/db/models/Court";
import { TournamentMatchModel } from "@/lib/db/models/TournamentMatch";
import {
  courtSchema,
  updateCourtSchema,
  type CourtInput,
  type UpdateCourtInput,
} from "@/lib/validations/court.schema";

export async function getCourts(activeOnly = true) {
  await connectDB();

  const filter = activeOnly ? { status: "ACTIVE" as const } : {};

  return CourtModel.find(filter)
    .collation({ locale: "es", numericOrdering: true })
    .sort({ name: 1 });
}

export async function getCourtById(id: string) {
  await connectDB();

  if (!isValidObjectId(id)) {
    return null;
  }

  return CourtModel.findById(id);
}

export async function createCourt(input: CourtInput) {
  const validatedData = courtSchema.parse(input);

  await connectDB();

  const exists = await CourtModel.exists({ name: validatedData.name });

  if (exists) {
    throw new Error("Ya existe una cancha con ese nombre");
  }

  return CourtModel.create(validatedData);
}

export async function updateCourt(
  id: string,
  input: UpdateCourtInput,
) {
  const validatedData = updateCourtSchema.parse(input);

  await connectDB();

  if (!isValidObjectId(id)) {
    return null;
  }

  if (validatedData.name !== undefined) {
    const duplicate = await CourtModel.exists({
      _id: { $ne: id },
      name: validatedData.name,
    });

    if (duplicate) {
      throw new Error("Ya existe una cancha con ese nombre");
    }
  }

  return CourtModel.findByIdAndUpdate(
    id,
    { $set: validatedData },
    { new: true, runValidators: true },
  );
}

export async function deleteCourt(id: string) {
  await connectDB();

  if (!isValidObjectId(id)) {
    return null;
  }

  const [hasBookings, hasTournamentMatches] = await Promise.all([
    BookingModel.exists({ courtId: id }),
    TournamentMatchModel.exists({ courtId: id }),
  ]);

  if (hasBookings || hasTournamentMatches) {
    throw new Error(
      "No se puede eliminar una cancha con reservas o partidos asociados",
    );
  }

  return CourtModel.findByIdAndDelete(id);
}
