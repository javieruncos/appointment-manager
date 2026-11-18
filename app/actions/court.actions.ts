"use server";

import { 
  createCourt, 
  updateCourt, 
  deleteCourt 
} from "@/lib/services/court.service";
import { revalidatePath } from "next/cache";
import type { CourtInput, UpdateCourtInput } from "@/lib/validations/court.schema";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function createCourtAction(input: CourtInput) {
  try {
    const court = await createCourt(input);

    revalidatePath("/courts");
    revalidatePath("/admin/courts");

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(court)) 
    };
  } catch (error) {
    return { 
      success: false, 
      error: getErrorMessage(error, "Error al crear la cancha")
    };
  }
}

export async function updateCourtAction(id: string, input: UpdateCourtInput) {
  try {
    const updated = await updateCourt(id, input);

    revalidatePath("/courts");
    revalidatePath("/admin/courts");

    return { 
      success: true, 
      data: updated ? JSON.parse(JSON.stringify(updated)) : null 
    };
  } catch (error) {
    return { 
      success: false, 
      error: getErrorMessage(error, "No se pudo actualizar la cancha")
    };
  }
}

export async function deleteCourtAction(id: string) {
  try {
    await deleteCourt(id);

    revalidatePath("/courts");
    revalidatePath("/admin/courts");

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: getErrorMessage(error, "No se pudo eliminar la cancha")
    };
  }
}