import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_change_in_production";
const COOKIE_NAME = "app_jwt_session";

export interface SessionPayload {
  userId: string;
  role: "ADMIN" | "STAFF";
}

/**
 * Firma un payload y retorna el token JWT.
 */
export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verifica y decodifica un token JWT. Retorna null si es inválido o expiró.
 */
export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Guarda el token en una cookie HTTP-only segura.
 */
export async function setAuthCookie(payload: SessionPayload): Promise<void> {
  const token = signToken(payload);
  const cookieStore = await cookies();

  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
}

/**
 * Obtiene la sesión actual leyendo y validando la cookie.
 */
export async function getAuthSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  return verifyToken(token);
}

/**
 * Cierra la sesión eliminando la cookie.
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}