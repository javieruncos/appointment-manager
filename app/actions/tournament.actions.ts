"use server";

import { 
  getTournaments, 
  createTournament, 
  updateTournament 
} from "@/lib/services/tournament.service";
import { 
  getTournamentMatches, 
  createTournamentMatch, 
  updateTournamentMatchScore 
} from "@/lib/services/tournament-match.service";
import { revalidatePath } from "next/cache";
import type { TournamentInput, UpdateTournamentInput } from "@/lib/validations/tournament.schema";
import type { TournamentMatchInput } from "@/lib/validations/tournament.schema";

// --- Acciones de Torneos ---
export async function createTournamentAction(input: TournamentInput) {
  try {
    const tournament = await createTournament(input);
    revalidatePath("/admin/tournaments");
    revalidatePath("/tournaments");
    return { success: true, data: JSON.parse(JSON.stringify(tournament)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al crear el torneo" };
  }
}

// --- Acciones de Partidos de Torneo ---
export async function updateTournamentMatchScoreAction(
  id: string, 
  score: { homeScore?: number | null; awayScore?: number | null; status?: string }
) {
  try {
    const updated = await updateTournamentMatchScore(id, score);
    revalidatePath("/admin/tournaments");
    revalidatePath("/tournaments");
    return { success: true, data: updated ? JSON.parse(JSON.stringify(updated)) : null };
  } catch (error: any) {
    return { success: false, error: error.message || "No se pudo actualizar el resultado" };
  }
}