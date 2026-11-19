import { z } from "zod";

export const createUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "name debe tener al menos 2 caracteres"),
    email: z.string().trim().email("email inválido"),
    password: z
      .string()
      .min(6, "password debe tener al menos 6 caracteres"),
    role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
  })
  .strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;
