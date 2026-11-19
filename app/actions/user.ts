"use server";

import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth/jwt";
import { createUserService } from "@/lib/services/user.service";
import { CreateUserInput } from "@/lib/validations/user.schema";
import { UserView } from "@/types/view";
import { ZodError } from "zod";

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createUserAction(rawInput: CreateUserInput): Promise<ActionResponse<UserView>> {
  try {
    // 1. Backend-as-the-Authority: Obtener y validar la sesión actual desde la cookie HTTP-only
    const session = await getAuthSession();
    if (!session || session.role !== "ADMIN") {
      return {
        success: false,
        error: "No autorizado. Se requiere iniciar sesión como Administrador.",
      };
    }

    // 2. Ejecutar el servicio de creación pasando el ID del admin autenticado
    const newUser = await createUserService(session.userId, rawInput);

    // 3. Revalidar la ruta donde se listan los usuarios (ajusta la ruta según tu estructura de UI)
    revalidatePath("/admin/users");

    return {
      success: true,
      data: newUser,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      // Tomar el primer mensaje de error de Zod para una respuesta limpia
      const errorMessage = error.issues[0]?.message || "Error de validación en los datos.";
      return { success: false, error: errorMessage };
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Ocurrió un error inesperado al crear el usuario." };
  }
}