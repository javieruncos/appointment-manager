"use server";

import { createTournament } from "@/lib/services/tournament.service";
import { updateTournamentMatchScore } from "@/lib/services/tournament-match.service";
import { revalidatePath } from "next/cache";
import type {
  TournamentInput,
  UpdateTournamentMatchInput,
} from "@/lib/validations/tournament.schema";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

// --- Acciones de Torneos ---
export async function createTournamentAction(input: TournamentInput) {
  try {
    const tournament = await createTournament(input);
    revalidatePath("/admin/tournaments");
    revalidatePath("/tournaments");
    return { success: true, data: JSON.parse(JSON.stringify(tournament)) };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Error al crear el torneo") };
  }
}

// --- Acciones de Partidos de Torneo ---
export async function updateTournamentMatchScoreAction(
  id: string, 
  score: UpdateTournamentMatchInput
) {
  try {
    const updated = await updateTournamentMatchScore(id, score);
    revalidatePath("/admin/tournaments");
    revalidatePath("/tournaments");
    return { success: true, data: updated ? JSON.parse(JSON.stringify(updated)) : null };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "No se pudo actualizar el resultado") };
  }
}