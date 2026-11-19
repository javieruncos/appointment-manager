import { z } from "zod";

export const loginSchema = z
  .object({
    email: z
      .string({ message: "El correo electrónico es obligatorio." })
      .trim()
      .toLowerCase()
      .email("Formato de correo electrónico inválido."),
    password: z
      .string({ message: "La contraseña es obligatoria." })
      .min(1, "La contraseña no puede estar vacía."),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;