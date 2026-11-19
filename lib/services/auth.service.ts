 import { loginSchema, LoginInput } from "@/lib/validations/auth.schema";
import bcrypt from "bcryptjs";
import UserModel from "../db/models/User";

export interface AuthResult {
  userId: string;
  role: "ADMIN" | "STAFF";
  name: string;
  email: string;
}

export async function loginService(rawInput: LoginInput): Promise<AuthResult> {
  // 1. Validar y normalizar con Zod
  const validatedData = loginSchema.parse(rawInput);

  // 2. Buscar al usuario y forzar la inclusión del password (ya que por defecto tiene select: false)
  const user = await UserModel.findOne({ email: validatedData.email }).select("+password");
  
  // Por seguridad, usamos un mensaje genérico para no filtrar si el email existe o no
  if (!user || !user.password) {
    throw new Error("Credenciales inválidas.");
  }

  // 3. Comparar la contraseña ingresada con el hash de la base de datos
  const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
  if (!isPasswordValid) {
    throw new Error("Credenciales inválidas.");
  }

  // 4. Retornar los datos limpios para la sesión
  return {
    userId: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
  };
}