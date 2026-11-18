import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { TournamentModel } from "@/lib/db/models/Tournament";
import { CourtModel } from "@/lib/db/models/Court";
import { TournamentMatchModel } from "@/lib/db/models/TournamentMatch";
import {
  tournamentMatchSchema,
  updateTournamentMatchSchema,
  type TournamentMatchInput,
  type UpdateTournamentMatchInput,
} from "@/lib/validations/tournament.schema";

export async function getTournamentMatches(filters: { tournamentId?: string; courtId?: string } = {}) {
  await connectDB();

  const query: Record<string, unknown> = {};

  if (filters.tournamentId) {
    if (!isValidObjectId(filters.tournamentId)) return [];
    query.tournamentId = filters.tournamentId;
  }

  if (filters.courtId) {
    if (!isValidObjectId(filters.courtId)) return [];
    query.courtId = filters.courtId;
  }

  return TournamentMatchModel.find(query).sort({
    date: 1,
    startTime: 1,
    round: 1,
    matchNumber: 1,
  });
}

export async function createTournamentMatch(input: TournamentMatchInput) {
  const data = tournamentMatchSchema.parse(input);

  await connectDB();

  const tournament = await TournamentModel.findById(data.tournamentId);
  if (!tournament) {
    throw new Error("El torneo no existe");
  }

  if (data.courtId) {
    const court = await CourtModel.findById(data.courtId);
    if (!court || court.status !== "ACTIVE") {
      throw new Error("La cancha no está activa o no existe");
    }
  }

  return TournamentMatchModel.create(data);
}

export async function updateTournamentMatchScore(
  id: string,
  score: UpdateTournamentMatchInput
) {
  const data = updateTournamentMatchSchema.parse(score);

  await connectDB();

  if (!isValidObjectId(id)) {
    return null;
  }

  const match = await TournamentMatchModel.findById(id);
  if (!match) {
    return null;
  }

  if (data.homeScore == null || data.awayScore == null) {
    throw new Error("Se requieren homeScore y awayScore");
  }

  match.homeScore = data.homeScore;
  match.awayScore = data.awayScore;
  
  if (data.status) {
    match.status = data.status;
  }

  if (match.status === "FINISHED" && data.homeScore !== data.awayScore) {
    match.winnerTeamName = data.homeScore > data.awayScore ? match.homeTeamName : match.awayTeamName;
  } else {
    match.winnerTeamName = null;
  }

  await match.save();
  return match;
}