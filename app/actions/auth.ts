"use server";

import { loginService } from "@/lib/services/auth.service";
import { setAuthCookie } from "@/lib/auth/jwt";
import { LoginInput } from "@/lib/validations/auth.schema";
import { ZodError } from "zod";

export type AuthActionResponse =
  | { success: true }
  | { success: false; error: string };

export async function loginAction(rawInput: LoginInput): Promise<AuthActionResponse> {
  try {
    // 1. Ejecutar el servicio de autenticación (valida Zod, busca usuario y compara bcrypt)
    const user = await loginService(rawInput);

    // 2. Generar el JWT y establecer la cookie HTTP-only segura en el navegador
    await setAuthCookie({
      userId: user.userId,
      role: user.role,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.issues[0]?.message || "Error de validación en los datos.";
      return { success: false, error: errorMessage };
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Ocurrió un error inesperado al iniciar sesión." };
  }
}