import bcrypt from "bcryptjs";
import { connectDB } from "../db/connect";
import { UserModel } from "@/lib/db/models/User";
import { createUserSchema, CreateUserInput } from "@/lib/validations/user.schema";
import { UserView } from "@/types/view";

export async function createUserService(
  adminUserId: string,
  rawInput: CreateUserInput
): Promise<UserView> {
  await connectDB();

  // 1. Backend-as-the-Authority: Verificar que el solicitante sea ADMIN
  const adminUser = await UserModel.findById(adminUserId);
  if (!adminUser || adminUser.role !== "ADMIN") {
    throw new Error("No autorizado: Se requiere rol de Administrador.");
  }

  // 2. Validar datos de entrada con Zod (schema estricto)
  const validatedData = createUserSchema.parse(rawInput);

  // 3. Verificar si el email ya existe
  const existingUser = await UserModel.findOne({ email: validatedData.email });
  if (existingUser) {
    throw new Error("Ya existe un usuario registrado con este correo electrónico.");
  }

  // 4. Hashear la contraseña
  const hashedPassword = await bcrypt.hash(validatedData.password, 10);

  // 5. Crear el usuario en la base de datos
  const newUser = await UserModel.create({
    name: validatedData.name,
    email: validatedData.email,
    password: hashedPassword,
    role: validatedData.role,
    isActive: true,
  });

  // 6. Retornar vista segura (UserView) sin exponer datos internos o hashes
  return {
    id: newUser._id.toString(),
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    isActive: newUser.isActive,
  };
}