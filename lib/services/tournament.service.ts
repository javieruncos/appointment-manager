import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { TournamentModel } from "@/lib/db/models/Tournament";
import {
  tournamentSchema,
  updateTournamentSchema,
  type TournamentInput,
  type UpdateTournamentInput,
} from "@/lib/validations/tournament.schema";
import type { TournamentStatus } from "@/types/domain";

export type TournamentFilters = {
  status?: TournamentStatus;
  category?: string;
};

export async function getTournaments(filters: TournamentFilters = {}) {
  await connectDB();

  const query = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.category ? { category: filters.category } : {}),
  };

  const tournaments = await TournamentModel.find(query).sort({
    startDate: 1,
    name: 1,
  });

  return tournaments;
}

export async function getTournamentById(id: string) {
  await connectDB();

  if (!isValidObjectId(id)) {
    return null;
  }

  return TournamentModel.findById(id);
}

export async function createTournament(input: TournamentInput) {
  const validatedData = tournamentSchema.parse(input);

  await connectDB();

  const exists = await TournamentModel.exists({
    name: validatedData.name,
    startDate: validatedData.startDate,
  });

  if (exists) {
    throw new Error(
      "Ya existe un torneo con ese nombre y fecha de inicio",
    );
  }

  return TournamentModel.create(validatedData);
}

export async function updateTournament(
  id: string,
  input: UpdateTournamentInput,
) {
  const validatedData = updateTournamentSchema.parse(input);

  await connectDB();

  if (!isValidObjectId(id)) {
    return null;
  }

  if (
    validatedData.name !== undefined ||
    validatedData.startDate !== undefined
  ) {
    const current = await TournamentModel.findById(id);

    if (!current) {
      return null;
    }

    const name = validatedData.name ?? current.name;
    const startDate = validatedData.startDate ?? current.startDate;

    const duplicate = await TournamentModel.exists({
      _id: { $ne: id },
      name,
      startDate,
    });

    if (duplicate) {
      throw new Error(
        "Ya existe un torneo con ese nombre y fecha de inicio",
      );
    }
  }

  return TournamentModel.findByIdAndUpdate(
    id,
    { $set: validatedData },
    { new: true, runValidators: true },
  );
}
